import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Users (admin)')
@ApiBearerAuth('jwt')
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
    // CDC §XVI — every column in the BO users table is clickable to sort.
    @Query('sort')
    sort?:
      | 'email'
      | 'created'
      | 'lastLogin'
      | 'name'
      | 'status'
      | 'orderCount'
      | 'revenue',
    @Query('dir') dir?: 'asc' | 'desc',
  ) {
    const users = await this.getUsersUseCase.execute();
    const filtered = users.filter((u) => {
      if (status === 'inactive' && u.isActive !== false) return false;
      if (status === 'pending' && u.isVerified !== false) return false;
      if (status === 'active' && (u.isActive === false || u.isVerified === false)) return false;
      if (query && !u.email.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });

    // Aggregate per-customer order count + revenue (cancelled excluded) and
    // address counts in two batched queries — much cheaper than N+1.
    const ids = filtered.map((u) => u.id);
    const stats = await this.orderRepository.getCustomerStats(ids);
    const addressCounts = await Promise.all(
      ids.map(async (id) => [id, (await this.addressRepository.findAllByUserId(id)).length] as const),
    );
    const addressMap = new Map(addressCounts);

    // We need the aggregated stats for the orderCount / revenue sorts, so sort
    // after the aggregation step. Default order matches the previous behaviour
    // (alphabetical by email, ascending) so existing UX is preserved.
    const direction = dir === 'desc' ? -1 : 1;
    const dateKey = (v: Date | string | null | undefined): number =>
      v ? new Date(v).getTime() : 0;
    filtered.sort((a, b) => {
      switch (sort) {
        case 'lastLogin':
          // Historical default for this field was DESC (most recent first).
          return (
            (dateKey(b.lastLoginAt) - dateKey(a.lastLoginAt)) *
            (dir === 'asc' ? -1 : 1)
          );
        case 'created':
          return (
            (dateKey(b.createdAt) - dateKey(a.createdAt)) *
            (dir === 'asc' ? -1 : 1)
          );
        case 'name': {
          const an = [a.firstName, a.lastName].filter(Boolean).join(' ').trim().toLowerCase()
            || a.email.toLowerCase();
          const bn = [b.firstName, b.lastName].filter(Boolean).join(' ').trim().toLowerCase()
            || b.email.toLowerCase();
          return an.localeCompare(bn) * direction;
        }
        case 'status': {
          // active < pending < inactive in display order — sort accordingly.
          const rank = (u: typeof a): number => {
            if (u.isActive === false) return 2;
            return u.isVerified ? 0 : 1;
          };
          return (rank(a) - rank(b)) * direction;
        }
        case 'orderCount':
          return (
            ((stats.get(a.id)?.orderCount ?? 0) -
              (stats.get(b.id)?.orderCount ?? 0)) *
            direction
          );
        case 'revenue':
          return (
            ((stats.get(a.id)?.revenue ?? 0) -
              (stats.get(b.id)?.revenue ?? 0)) *
            direction
          );
        case 'email':
        default:
          return a.email.localeCompare(b.email) * direction;
      }
    });

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
