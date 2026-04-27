import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const REFRESH_COOKIE_NAME = 'refresh_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const PROTECTED_ROUTES = new Set(['/api/auth/refresh', '/api/auth/logout']);

function readCookie(rawCookieHeader: string | undefined, name: string): string | null {
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
      originalUrl?: string;
      headers?: Record<string, string | undefined>;
    }>();

    const url = req.originalUrl ?? '';
    if (!PROTECTED_ROUTES.has(url)) return true;

    const rawCookies = req.headers?.cookie;
    const refreshCookie = readCookie(rawCookies, REFRESH_COOKIE_NAME);
    // No refresh cookie means no cookie-auth session to protect.
    if (!refreshCookie) return true;

    const cookieToken = readCookie(rawCookies, CSRF_COOKIE_NAME);
    const headerToken = req.headers?.[CSRF_HEADER_NAME];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF_TOKEN_INVALID');
    }
    return true;
  }
}
