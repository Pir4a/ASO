import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";
import { AuthGuard } from "@/components/guards/AuthGuard"; // Importez AuthGuard
import { ProductForm } from "@/components/backoffice/ProductForm"; // Import du nouveau composant de formulaire

export default async function BackofficePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  return (
    // Enveloppez le contenu avec AuthGuard
    <AuthGuard>
      <div className="space-y-6">
        <div className="card p-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Backoffice (MVP)</h1>
          <p className="text-sm text-slate-600">
            Gestion des contenus : carrousel, catégories, produits. API NestJS sécurisée.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Produits</p>
            <p className="text-2xl font-semibold text-primary">{products.length}</p>
            <Link href="/backoffice/products" className="text-sm text-primary">
              Voir la liste
            </Link>
          </div>
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Catégories</p>
            <p className="text-2xl font-semibold text-primary">{categories.length}</p>
            <Link href="/backoffice/categories" className="text-sm text-primary">
              Gérer les catégories
            </Link>
          </div>
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Utilisateurs</p>
            <p className="text-2xl font-semibold text-primary">Backoffice</p>
            <Link href="/backoffice/users" className="text-sm text-primary">
              Gérer les utilisateurs
            </Link>
          </div>
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Contenus</p>
            <p className="text-2xl font-semibold text-primary">Homepage</p>
            <Link href="/backoffice/homepage" className="text-sm text-primary">
              Gérer la page d'accueil
            </Link>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <p className="text-2xl font-semibold text-primary">FAQ</p>
            <Link href="/backoffice/faq" className="text-sm text-primary">
              Gestion des FAQ
            </Link>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <p className="text-2xl font-semibold text-primary">Chatbot</p>
            <Link href="/backoffice/chatbot" className="text-sm text-primary">
              Conversations
            </Link>
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <p className="text-2xl font-semibold text-primary">Contact</p>
            <Link href="/backoffice/contact-messages" className="text-sm text-primary">
              Messages de contact
            </Link>
          </div>
        </div>

        {/* Nouvelle section pour l'ajout de matériel */}
        <ProductForm categories={categories} products={products} />

        <div className="card p-6 space-y-3">
          <p className="text-sm font-semibold text-slate-900">Actions rapides</p>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary">
              Import produits (CSV)
            </button>
            <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary">
              Mise à jour carrousel
            </button>
            <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary">
              Publier texte homepage
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Ces actions appelleront les endpoints NestJS protégés (auth admin requise).
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
