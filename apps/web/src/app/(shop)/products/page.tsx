import Link from "next/link";
import { getProducts } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductsListPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Catalogue produits</CardTitle>
          <CardDescription>
            Pagination et filtres seront gérés côté API.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {product.sku}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-lg font-semibold text-primary">
                  {(product.priceCents / 100).toFixed(2)} {product.currency}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
