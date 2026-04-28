import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type LocalizedFields = { name?: string; description?: string };
type TranslationsMap = Record<string, LocalizedFields>;

const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'he'] as const;

@Injectable()
export class AutoTranslationService {
  private readonly logger = new Logger(AutoTranslationService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.ollamaUrl = this.config.get<string>('OLLAMA_URL', 'http://localhost:11434');
    this.model = this.config.get<string>('OLLAMA_MODEL', 'llama3.2:3b');
  }

  async ensureTranslations(input: {
    name: string;
    description: string;
    existing?: Record<string, { name?: string; description?: string }>;
  }): Promise<TranslationsMap> {
    const existing: TranslationsMap = { ...(input.existing ?? {}) };
    const missingLocales = SUPPORTED_LOCALES.filter((locale) => {
      const tr = existing[locale];
      return !tr?.name?.trim() || !tr?.description?.trim();
    });

    if (!missingLocales.length) return existing;

    const generated = await this.generateWithOllama({
      sourceName: input.name,
      sourceDescription: input.description,
      locales: missingLocales,
    });

    const merged: TranslationsMap = { ...existing };
    for (const locale of SUPPORTED_LOCALES) {
      const prev = merged[locale] ?? {};
      const next = generated[locale] ?? {};
      merged[locale] = {
        name: prev.name?.trim() || next.name?.trim() || input.name,
        description:
          prev.description?.trim() || next.description?.trim() || input.description,
      };
    }
    return merged;
  }

  private async generateWithOllama(input: {
    sourceName: string;
    sourceDescription: string;
    locales: readonly string[];
  }): Promise<TranslationsMap> {
    const prompt = [
      'Translate product/category texts to target locales.',
      `Target locales: ${input.locales.join(', ')}`,
      `Source name: ${input.sourceName}`,
      `Source description: ${input.sourceDescription}`,
      'Return ONLY valid JSON object with this exact shape:',
      '{"fr":{"name":"...","description":"..."},"en":{"name":"...","description":"..."},"ar":{"name":"...","description":"..."},"he":{"name":"...","description":"..."}}',
      'Rules:',
      '- Keep medical terminology accurate.',
      '- Do not add extra commentary.',
      '- If source language is already one target language, still provide all targets.',
    ].join('\n');

    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Ollama translate failed ${response.status}: ${body}`);
        return {};
      }

      const data = (await response.json()) as { response?: string };
      const parsed = this.safeParseJson(data.response ?? '');
      return parsed ?? {};
    } catch (e) {
      this.logger.warn(
        `Ollama translate request failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      return {};
    }
  }

  private safeParseJson(raw: string): TranslationsMap | null {
    const direct = this.tryParse(raw);
    if (direct) return direct;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return this.tryParse(match[0]);
  }

  private tryParse(raw: string): TranslationsMap | null {
    try {
      const obj = JSON.parse(raw) as unknown;
      if (!obj || typeof obj !== 'object') return null;
      return obj as TranslationsMap;
    } catch {
      return null;
    }
  }
}
