import Link from "next/link";
import { getCart } from "@/lib/api";

export default async function CartPage() {
  const cart = await getCart();
  const subtotal = cart.subtotal;

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Panier</h1>
        <p className="text-sm text-slate-600">
          Calcul TVA/frais sera géré côté API. Les statuts de stock sont visibles avant le checkout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.name ?? item.productId}</p>
                <p className="text-xs text-slate-500">{item.productId}</p>
                <p className="text-sm text-primary">
                  {(item.priceCents / 100).toFixed(2)} {item.currency}
                </p>
              </div>
              <div className="text-sm text-slate-600">Qté : {item.quantity}</div>
            </div>
          ))}
        </div>
        <div className="card space-y-3 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Récapitulatif</h2>
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>Sous-total</span>
            <span>
              {(subtotal / 100).toFixed(2)} {cart.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>TVA (20%)</span>
            <span>
              {(cart.vat / 100).toFixed(2)} {cart.currency}
            </span>
          </div>
          <hr className="border-slate-200" />
          <div className="flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total estimé</span>
            <span>
              {(cart.total / 100).toFixed(2)} {cart.currency}
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-2 inline-flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            Passer au checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

