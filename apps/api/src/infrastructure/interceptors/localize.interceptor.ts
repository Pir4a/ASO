import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { resolveLocaleFromRequest, DEFAULT_LOCALE } from '../../i18n/locale-resolver';

const DEFAULT_BASE_LOCALE = DEFAULT_LOCALE;

/** Fields we'll override when a matching translation exists. */
const LOCALIZABLE_KEYS = [
  'name',
  'description',
  'title',
  'subtitle',
  'body',
  'headline',
  'ctaLabel',
] as const;

/**
 * Walks the response shape and, on any object that carries a
 * `translations[lang]` block, overrides the known localizable string fields:
 * - products / categories: `name`, `description`
 * - carousel slides:       `title`, `subtitle`, `ctaLabel`
 * - homepage_text:         `headline`, `body`
 * Locale comes from the `?lang=` query param. Default base locale is English.
 */
function localize(value: unknown, lang: string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = { ...obj };

  const tField = obj.translations as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (tField && typeof tField === 'object') {
    const localized = tField[lang];
    if (localized && typeof localized === 'object') {
      for (const key of LOCALIZABLE_KEYS) {
        const v = localized[key];
        if (typeof v === 'string' && v.trim()) {
          out[key] = v;
        }
      }
    }
  }

  for (const key of Object.keys(out)) {
    if (key === 'translations') continue;
    out[key] = localize(out[key], lang);
  }
  return out;
}

@Injectable()
export class LocalizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const lang = resolveLocaleFromRequest(req, DEFAULT_BASE_LOCALE);
    if (lang === DEFAULT_BASE_LOCALE) {
      return next.handle();
    }
    return next.handle().pipe(map((data) => localize(data, lang)));
  }
}
