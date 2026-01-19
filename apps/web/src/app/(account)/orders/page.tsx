import { getOrders } from "@/lib/api";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Mes commandes</h1>
        <p className="text-sm text-slate-600">Historique et suivi des commandes.</p>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{order.id}</p>
                <p className="text-xs text-slate-500">{order.createdAt}</p>
              </div>
              <p className="text-sm font-semibold text-primary">
                {(order.totalCents / 100).toFixed(2)} {order.currency}
              </p>
            </div>
            <p className="text-sm text-slate-600">Statut : {order.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

