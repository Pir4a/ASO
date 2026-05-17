import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Attaches `req.user` when a valid Bearer JWT is sent; otherwise leaves user unset without 401. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string | undefined> }>();
    const auth = req.headers?.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return true;
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  override handleRequest<TUser>(_err: unknown, user: TUser): TUser | undefined {
    return user ?? undefined;
  }
}
