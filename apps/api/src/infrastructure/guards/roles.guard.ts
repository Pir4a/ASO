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

    // CDC §XVI.9 — admin endpoints require an MFA-cleared session. We enforce
    // it only for admins who have already enrolled MFA: an unenrolled admin
    // still needs to reach the BO to enable it. Once mfaEnabled flips to true
    // (after /auth/mfa/setup + /verify), the gate becomes mandatory for that
    // user's subsequent sessions and the front-end is expected to walk them
    // through the second-step challenge at login.
    if (requiredRoles.includes('admin') && user.mfaEnabled === true && user.mfa !== true) {
      throw new ForbiddenException({
        message: 'MFA required for admin operations.',
        code: 'MFA_REQUIRED',
      });
    }
    return true;
  }
}
