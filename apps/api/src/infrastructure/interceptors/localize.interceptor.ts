import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const KNOWN_LOCALES = new Set(['en', 'fr', 'ar', 'he']);
const DEFAULT_BASE_LOCALE = 'en';

/**
 * Walks the response shape and overrides `name` / `description` on any object
 * that carries a `translations[lang]` block. Locale comes from the `?lang=`
 * query param. Default base locale is English (existing seed text).
 */
function localize(value: unknown, lang: string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };

  const tField = obj.translations as
    | Record<string, { name?: string; description?: string }>
    | undefined;
  if (tField && typeof tField === 'object') {
    const localized = tField[lang];
    if (localized && typeof localized === 'object') {
      if (typeof localized.name === 'string' && localized.name.trim()) {
        out.name = localized.name;
      }
      if (
        typeof localized.description === 'string' &&
        localized.description.trim()
      ) {
        out.description = localized.description;
      }
    }
  }

  for (const key of Object.keys(out)) {
    if (key === 'translations') continue;
    out[key] = localize(out[key], lang);
  }
  return out;
}

interface RequestWithLang {
  query?: { lang?: unknown };
}

@Injectable()
export class LocalizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithLang>();
    const langRaw = req?.query?.lang;
    const lang =
      typeof langRaw === 'string' && KNOWN_LOCALES.has(langRaw)
        ? langRaw
        : null;
    if (!lang || lang === DEFAULT_BASE_LOCALE) {
      return next.handle();
    }
    return next.handle().pipe(map((data) => localize(data, lang)));
  }
}
