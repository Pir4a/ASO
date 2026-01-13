import { Body, Controller, HttpCode, HttpStatus, Post, Patch, Param } from '@nestjs/common'; // Added Patch, Param
import { AuthService } from './auth.service';
import { AuthDto, UpdateUserRoleDto } from './dto/auth.dto'; // Added UpdateUserRoleDto

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() authDto: AuthDto) {
    return this.authService.register(authDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto);
  }

  @Patch('user/:id/role')
  // TODO: Implement AuthGuard and RolesGuard to protect this endpoint
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('admin')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    // For now, this endpoint is unprotected. In a real application, it MUST be protected by an admin role guard.
    return this.authService.updateUserRole(userId, updateUserRoleDto.role);
  }
}
