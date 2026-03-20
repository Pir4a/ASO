import { notFound } from "next/navigation";
import { getCategories, getProductBySlug } from "@/lib/api";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import type { Category } from "@bootstrap/types";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
  ]);
  if (!product) return notFound();
  const category = categories.find((c: Category) => c.id === product.categoryId);

  return <ProductDetailClient product={product} category={category} />;
}

