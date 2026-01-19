import { redirect } from "next/navigation";

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  // Redirect to unified products page with search query
  const query = searchParams?.q || "";
  redirect(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
}
