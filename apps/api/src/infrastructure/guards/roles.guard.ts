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
    const user = request.user as
      | { role?: UserRole; mfa?: boolean; mfaEnabled?: boolean }
      | undefined;
    if (!user?.role || !requiredRoles.includes(user.role)) return false;

    // CDC §XVI.10 — admin endpoints REQUIRE strong (MFA-cleared) auth. Two
    // failure modes to surface distinctly so the front-end can route the user
    // correctly:
    //   1. The admin has no MFA enrolled at all → block all /admin/* routes
    //      and tell them to enroll. /profile remains reachable because it is
    //      gated by JwtAuthGuard only.
    //   2. The admin enrolled MFA but the current session never cleared the
    //      challenge (refresh-only re-auth, stale token, etc.) → block and
    //      ask them to log in again so the MFA challenge is presented.
    if (requiredRoles.includes('admin') && user.role === 'admin') {
      if (user.mfaEnabled !== true) {
        throw new ForbiddenException({
          message: 'MFA enrollment is required for admin access.',
          code: 'ADMIN_MFA_REQUIRED',
        });
      }
      if (user.mfa !== true) {
        throw new ForbiddenException({
          message: 'MFA required for admin operations.',
          code: 'MFA_REQUIRED',
        });
      }
    }
    return true;
  }
}
