import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { GetAdminUsersUseCase } from '../../../application/use-cases/users/get-admin-users.use-case';
import { UpdateUserStatusUseCase } from '../../../application/use-cases/users/update-user-status.use-case';
import { UpdateUserRoleUseCase } from '../../../application/use-cases/users/update-user-role.use-case';
import { ResetUserPasswordUseCase } from '../../../application/use-cases/users/reset-user-password.use-case';
import { ORDER_REPOSITORY_TOKEN } from '../../../domain/repositories/order.repository.interface';
import type { OrderRepository } from '../../../domain/repositories/order.repository.interface';
import { Inject } from '@nestjs/common';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly getAdminUsersUseCase: GetAdminUsersUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: OrderRepository,
  ) { }

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: 'active' | 'inactive' | 'pending',
  ) {
    return this.getAdminUsersUseCase.execute({ search, role, status });
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.updateUserStatusUseCase.execute(id, Boolean(isActive));
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: 'customer' | 'admin') {
    return this.updateUserRoleUseCase.execute(id, role);
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.resetUserPasswordUseCase.execute(id);
  }

  @Get(':id/orders')
  async getOrders(@Param('id') id: string) {
    return this.orderRepository.findAllByUserId(id);
  }
}
