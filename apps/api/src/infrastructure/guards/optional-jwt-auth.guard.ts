import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT auth guard.
 * - If a valid Bearer token is present, `req.user` is populated.
 * - If no token or the token is invalid, the request continues as an unauthenticated/guest request
 *   (no 401 is raised).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Ignore auth errors for optional routes.
    }
    return true;
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user as TUser;
  }
}
