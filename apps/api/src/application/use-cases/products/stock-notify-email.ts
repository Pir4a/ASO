type JwtUser = { sub: string; email: string };

export function resolveStockNotifyEmail(input: {
  emailFromBody?: string;
  emailFromQuery?: string;
  user?: JwtUser;
}): string | null {
  const raw = input.user?.email ?? input.emailFromBody ?? input.emailFromQuery;
  if (!raw?.trim()) return null;
  return raw.trim().toLowerCase();
}
