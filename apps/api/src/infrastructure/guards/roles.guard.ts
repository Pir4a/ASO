import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../../domain/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole; mfa?: boolean } | undefined;
    if (!user?.role || !requiredRoles.includes(user.role)) return false;

    // CDC §XVI.9 — admin endpoints require an MFA-cleared session. The JWT
    // carries `mfa: true` only after a successful /auth/mfa/challenge, so an
    // admin who hasn't enrolled MFA yet still gets a customer-grade token
    // and is rejected here with a clear "MFA required" hint.
    if (requiredRoles.includes('admin') && user.mfa !== true) {
      throw new ForbiddenException({
        message: 'MFA required for admin operations.',
        code: 'MFA_REQUIRED',
      });
    }
    return true;
  }
}
