import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/home/ProductGrid";
import { getCategories, getProducts } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CategoryDetail({ params }: { params: { slug: string } }) {
  const [categories, productsList] = await Promise.all([getCategories(), getProducts()]);
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return notFound();

  const products = productsList.filter((p) => p.categoryId === category.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Catégorie</p>
              <CardTitle className="text-2xl">{category.name}</CardTitle>
            </div>
            <Badge variant="secondary">{products.length} produits</Badge>
          </div>
          <CardDescription>{category.description}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
