import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

function readCookie(
  rawCookieHeader: string | undefined,
  name: string,
): string | null {
  if (!rawCookieHeader) return null;
  const parts = rawCookieHeader.split(';');
  for (const p of parts) {
    const [k, ...v] = p.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      headers?: Record<string, string | undefined>;
    }>();

    const method = (req.method ?? 'GET').toUpperCase();
    if (SAFE_METHODS.has(method)) return true;

    const url = req.originalUrl ?? '';
    if (url.startsWith('/api/payment/webhook')) return true;

    const auth = req.headers?.authorization ?? '';
    const isBearerRequest = auth.startsWith('Bearer ');
    // We enforce CSRF on authenticated browser requests.
    if (!isBearerRequest) return true;

    const cookieToken = readCookie(req.headers?.cookie, CSRF_COOKIE_NAME);
    const headerToken = req.headers?.[CSRF_HEADER_NAME];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF_TOKEN_INVALID');
    }
    return true;
  }
}
