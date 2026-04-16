import Link from "next/link";
import { getCategories } from "@/lib/api";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Catégories</h1>
        <p className="text-sm text-foreground/70">
          Navigation par univers produit, éditable depuis le backoffice.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="rounded-lg border border-primary/25 bg-background p-4 shadow-sm hover:border-primary"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{cat.name}</p>
              <span className="text-xs text-foreground/60">#{cat.order}</span>
            </div>
            <p className="text-sm text-foreground/70">{cat.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

