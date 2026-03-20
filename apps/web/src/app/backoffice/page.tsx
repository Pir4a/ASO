import { getCategories, getProducts, getOrders, getAdminDashboardStats } from "@/lib/api";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { DashboardClient } from "@/components/backoffice/DashboardClient";

export default async function BackofficePage() {
  const [categories, products, orders, stats] = await Promise.all([
    getCategories(),
    getProducts(),
    getOrders(),
    getAdminDashboardStats(),
  ]);

  return (
    <AuthGuard>
      <DashboardClient
        productsCount={products.length}
        categoriesCount={categories.length}
        orders={orders}
        stats={stats}
      />
    </AuthGuard>
  );
}
