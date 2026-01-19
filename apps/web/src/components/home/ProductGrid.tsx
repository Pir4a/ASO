import Image from "next/image";
import Link from "next/link";
import { Product } from "@bootstrap/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<Product["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  in_stock: { label: "En stock", variant: "success" },
  low_stock: { label: "Stock faible", variant: "warning" },
  out_of_stock: { label: "Rupture", variant: "destructive" },
  new: { label: "Nouveau", variant: "secondary" },
};

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => {
        const status = statusConfig[product.status];
        return (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden">
              <div className="relative h-40 w-full overflow-hidden bg-slate-50">
                {product.thumbnailUrl ? (
                  <Image
                    src={product.thumbnailUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Image à venir
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-sm line-clamp-1">{product.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <Badge variant={status.variant} className="shrink-0">
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-base font-semibold text-primary">
                  {(product.priceCents / 100).toFixed(2)} {product.currency}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
