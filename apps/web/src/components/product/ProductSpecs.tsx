type ProductSpecsProps = {
  specs: Record<string, string>;
};

export function ProductSpecs({ specs }: ProductSpecsProps) {
  const entries = Object.entries(specs).filter(([k, v]) => k.trim() && String(v).trim());
  if (entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-lg font-semibold text-slate-900">Caractéristiques techniques</h2>
      <dl className="mt-4 divide-y divide-slate-100">
        {entries.map(([key, value]) => (
          <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</dt>
            <dd className="text-sm text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
