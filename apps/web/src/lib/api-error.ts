export function parseApiError(payload: unknown): { message: string; code?: string } {
  if (!payload || typeof payload !== "object") {
    return { message: "Une erreur est survenue." };
  }
  const p = payload as Record<string, unknown>;
  if (typeof p.code === "string" && typeof p.message === "string") {
    return { message: p.message, code: p.code };
  }
  const msgField = p.message;
  if (typeof msgField === "string") {
    return { message: msgField, code: typeof p.code === "string" ? p.code : undefined };
  }
  if (msgField && typeof msgField === "object") {
    const inner = msgField as Record<string, unknown>;
    return {
      message:
        typeof inner.message === "string" ? inner.message : "Une erreur est survenue.",
      code: typeof inner.code === "string" ? inner.code : undefined,
    };
  }
  return { message: "Une erreur est survenue." };
}
