type LocalizedText = {
  name?: string;
  description?: string;
};

type TranslationMap = Record<string, LocalizedText> | undefined;

function normalizeLang(lang?: string): string[] {
  const raw = (lang ?? "").trim().toLowerCase();
  if (!raw) return [];
  const base = raw.split("-")[0];
  return base && base !== raw ? [raw, base] : [raw];
}

function pickText(
  fallback: { name?: string; description?: string },
  translations: TranslationMap,
  lang?: string,
): { name?: string; description?: string } {
  if (!translations) return fallback;
  for (const key of normalizeLang(lang)) {
    const t = translations[key];
    if (!t) continue;
    return {
      name: t.name?.trim() || fallback.name,
      description: t.description?.trim() || fallback.description,
    };
  }
  return fallback;
}

export function localizeCategory<T extends { name?: string; description?: string; translations?: TranslationMap }>(
  category: T,
  lang?: string,
): T {
  if (!category) return category;
  const localized = pickText(
    { name: category.name, description: category.description },
    category.translations,
    lang,
  );
  return {
    ...category,
    name: localized.name ?? category.name,
    description: localized.description ?? category.description,
  };
}

export function localizeProduct<
  T extends {
    name?: string;
    description?: string;
    translations?: TranslationMap;
    category?: { name?: string; description?: string; translations?: TranslationMap };
  },
>(product: T, lang?: string): T {
  if (!product) return product;
  const localized = pickText(
    { name: product.name, description: product.description },
    product.translations,
    lang,
  );
  return {
    ...product,
    name: localized.name ?? product.name,
    description: localized.description ?? product.description,
    category: product.category ? localizeCategory(product.category, lang) : product.category,
  };
}
