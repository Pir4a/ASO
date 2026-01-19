import Image from "next/image";
import Link from "next/link";
import { Category } from "@bootstrap/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {categories.map((cat) => (
        <Link key={cat.id} href={`/categories/${cat.slug}`}>
          <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary cursor-pointer overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{cat.name}</CardTitle>
                <Badge variant="outline">#{cat.order}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {cat.imageUrl ? (
                <div className="relative h-28 w-full overflow-hidden rounded-lg">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                  Visuel à venir
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
