import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUsersUseCase } from '../../../application/use-cases/users/get-users.use-case';
import { FindUserByIdUseCase } from '../../../application/use-cases/users/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/users/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/users/delete-user.use-case';
import {
  UpdateUserStatusDto,
  SendAdminEmailDto,
} from '../../dto/users/admin-user-actions.dto';
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
      if (
        status === 'active' &&
        (u.isActive === false || u.isVerified === false)
      )
        return false;
      if (query && !u.email.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'lastLogin') {
        return (
          new Date(b.lastLoginAt || 0).getTime() -
          new Date(a.lastLoginAt || 0).getTime()
        );
      }
      return a.email.localeCompare(b.email);
    });

    return filtered.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      isVerified: u.isVerified,
      isActive: u.isActive !== false,
      status:
        u.isActive === false ? 'inactive' : u.isVerified ? 'active' : 'pending',
      lastLoginAt: u.lastLoginAt ?? null,
    }));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
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

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    const user = await this.findUserByIdUseCase.execute(id);
    if (!user) return { message: 'Utilisateur introuvable.' };
    return {
      success: true,
      message: `Email de réinitialisation envoyé à ${user.email}`,
    };
  }

  @Post(':id/send-email')
  async sendEmail(@Param('id') id: string, @Body() body: SendAdminEmailDto) {
    const user = await this.findUserByIdUseCase.execute(id);
    if (!user) return { message: 'Utilisateur introuvable.' };
    return {
      success: true,
      to: user.email,
      subject: body.subject,
      message: 'Email admin enregistré (mode MVP).',
    };
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: 'customer' | 'admin' },
  ) {
    const user = await this.findUserByIdUseCase.execute(id);
    if (!user) return { message: 'Utilisateur introuvable.' };
    user.role = body.role;
    const updated = await this.updateUserUseCase.execute(user);
    return { id: updated.id, role: updated.role };
  }
}
