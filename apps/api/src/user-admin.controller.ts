import { Controller, Get, Patch, Delete, Post, Body, Param, Query } from '@nestjs/common';
import { AdminUserActionsUseCase } from './application/use-cases/users/admin-user-actions.use-case';
import { GetAdminUsersUseCase } from './application/use-cases/users/get-admin-users.use-case';
import { GetUsersFilterDto } from './infrastructure/controllers/users/dto/get-users-filter.dto';

@Controller('admin/users')
export class UserAdminController {
  constructor(
    private readonly adminUseCase: AdminUserActionsUseCase,
    private readonly getAdminUsersUseCase: GetAdminUsersUseCase
  ) {}

  @Get()
  findAll(@Query() filters: GetUsersFilterDto) {
    return this.getAdminUsersUseCase.execute(filters);
  }

  @Patch(':id/reset-password')
  reset(@Param('id') id: string) {
    return this.adminUseCase.resetPassword(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('active') active: boolean) {
    return this.adminUseCase.toggleStatus(id, active);
  }

  @Patch('bulk-status')
  bulkStatus(@Body() dto: { ids: string[], active: boolean }) {
    return this.adminUseCase.bulkUpdateStatus(dto.ids, dto.active);
  }

  @Patch('reorder')
  reorder(@Body() dto: { ids: string[] }) {
    return this.adminUseCase.updateOrder(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminUseCase.deleteUserRGPD(id);
  }

  @Post('email')
  sendMail(@Body() dto: { to: string, subject: string, content: string }) {
    return this.adminUseCase.sendAdminEmail(dto.to, dto.subject, dto.content);
  }
}   