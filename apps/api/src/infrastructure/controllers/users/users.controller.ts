import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUsersUseCase } from '../../../application/use-cases/users/get-users.use-case';
import { FindUserByIdUseCase } from '../../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/users/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/users/delete-user.use-case';
import { RequestPasswordResetUseCase } from '../../../application/use-cases/auth/request-password-reset.use-case';
import {
  ORDER_REPOSITORY_TOKEN,
  type OrderRepository,
} from '../../../domain/repositories/order.repository.interface';
import {
  ADDRESS_REPOSITORY_TOKEN,
  type AddressRepository,
} from '../../../domain/repositories/address.repository.interface';
import { UpdateUserStatusDto } from '../../dto/users/admin-user-actions.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
    @Inject(ADDRESS_REPOSITORY_TOKEN)
    private readonly addressRepository: AddressRepository,
  ) {}

  @Get()
  async findAll(
    @Query('q') query?: string,
    @Query('status') status?: 'active' | 'inactive' | 'pending',
    @Query('sort') sort?: 'email' | 'created' | 'lastLogin',
  ) {
    const users = await this.getUsersUseCase.execute();
    const filtered = users.filter((u) => {
      if (status === 'inactive' && u.isActive !== false) return false;
      if (status === 'pending' && u.isVerified !== false) return false;
      if (status === 'active' && (u.isActive === false || u.isVerified === false)) return false;
      if (query && !u.email.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'lastLogin') {
        return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
      }
      return a.email.localeCompare(b.email);
    });

    // Aggregate per-customer order count + revenue (cancelled excluded) and
    // address counts in two batched queries — much cheaper than N+1.
    const ids = filtered.map((u) => u.id);
    const stats = await this.orderRepository.getCustomerStats(ids);
    const addressCounts = await Promise.all(
      ids.map(async (id) => [id, (await this.addressRepository.findAllByUserId(id)).length] as const),
    );
    const addressMap = new Map(addressCounts);

    return filtered.map((u) => {
      const s = stats.get(u.id);
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: fullName || null,
        isVerified: u.isVerified,
        isActive: u.isActive !== false,
        status: u.isActive === false ? 'inactive' : u.isVerified ? 'active' : 'pending',
        lastLoginAt: u.lastLoginAt ?? null,
        createdAt: u.createdAt ?? null,
        orderCount: s?.orderCount ?? 0,
        revenue: s?.revenue ?? 0,
        addressCount: addressMap.get(u.id) ?? 0,
      };
    });
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    const user = await this.findUserByIdUseCase.execute(id);
    if (!user) return { message: 'Utilisateur introuvable.' };
    user.isActive = body.status === 'active';
    const updated = await this.updateUserUseCase.execute(user);
    return { id: updated.id, status: updated.isActive ? 'active' : 'inactive' };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.deleteUserUseCase.execute(id);
    return { success: true };
  }

  /** Triggers the real ticket-#1 reset-password flow (email + 24h token). */
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    const user = await this.findUserByIdUseCase.execute(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    await this.requestPasswordResetUseCase.execute(user.email);
    return { success: true, sentTo: user.email };
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: { role: 'customer' | 'admin' }) {
    const user = await this.findUserByIdUseCase.execute(id);
    if (!user) return { message: 'Utilisateur introuvable.' };
    user.role = body.role;
    const updated = await this.updateUserUseCase.execute(user);
    return { id: updated.id, role: updated.role };
  }
}
