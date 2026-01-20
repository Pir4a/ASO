import { Carousel } from "@/components/home/Carousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductGridClient } from "@/components/home/ProductGridClient";
import { getHomepageData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Globe, Activity, Stethoscope, Microscope } from "lucide-react";

export default async function Home() {
  const { categories, products, slides } = await getHomepageData();

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Asymmetric Hero Section */}
      <section className="relative pt-10 md:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-blue-50 text-primary border border-blue-100 text-xs font-semibold tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Standard Médical 2026 certifié
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              L'excellence <br />
              <span className="text-primary">médicale</span> réinventée.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed">
              Equipez votre établissement avec la nouvelle génération de matériel médical.
              Performance, conformité et design au service du soin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 rounded-full px-8 text-base shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1" asChild>
                <Link href="/products">
                  Parcourir le catalogue <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 rounded-full px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900" asChild>
                <Link href="/contact">
                  Demander un devis
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-slate-900">2.5k+</span>
                <span className="text-sm text-slate-500 font-medium">Clients Cliniques</span>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-slate-900">98%</span>
                <span className="text-sm text-slate-500 font-medium">Satisfation Client</span>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-slate-900">24/7</span>
                <span className="text-sm text-slate-500 font-medium">Support Expert</span>
              </div>
            </div>
          </div>

          <div className="relative lg:h-[600px] w-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-indigo-50 border border-slate-100 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {/* Abstract Visual Representation instead of generic stock photo if not available */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                <div className="absolute top-10 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />

                {/* Floating Elements Mockup */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[80%] md:h-[60%] w-[90%] bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <Activity className="size-16 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800">Technologie de Pointe</h3>
                    <p className="text-slate-500 mt-2">Solutions intégrées pour la santé de demain.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-heading font-bold text-slate-900">Pourquoi choisir Althea ?</h2>
          <p className="text-slate-500 mt-2">Une excellence opérationnelle à chaque étape.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-lg">
            <div className="relative z-10">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Zap className="size-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Livraison Ultra-Rapide</h3>
              <p className="text-slate-300 max-w-md">Notre réseau logistique optimisé garantit une livraison en moins de 24h pour les urgences vitales. Suivi temps réel inclus.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl mr-[-50px] mb-[-50px]"></div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm flex flex-col justify-center gap-4 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
              <ShieldCheck className="size-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Certifié ISO</h3>
              <p className="text-slate-500 mt-1">Tous nos produits respectent les normes européennes les plus strictes.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-blue-50 border border-blue-100 p-8 shadow-sm flex flex-col justify-center gap-4 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Globe className="size-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Support Global</h3>
              <p className="text-slate-500 mt-1">Une équipe d'experts disponible partout dans le monde pour vous assister.</p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 rounded-3xl bg-white border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 hover:shadow-md transition-shadow">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Microscope className="size-5" />
                <span>Innovation</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Dernières Innovations</h3>
              <p className="text-slate-500">Accédez en avant-première aux technologies qui façonnent la médecine de demain. Neurochirurgie, imagerie IA, et plus.</p>
              <Button variant="link" className="p-0 h-auto text-primary" asChild>
                <Link href="/products?category=new">Voir les nouveautés <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
            </div>
            <div className="flex-1 w-full h-40 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
              <Stethoscope className="size-16 text-slate-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Sélection Expert</h2>
            <p className="text-slate-500">Les produits les plus recommandés par nos spécialistes.</p>
          </div>
        </div>
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5">
          <Carousel slides={slides} />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Parcourir par Spécialité</h2>
          </div>
          <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-slate-100">
            <Link href="/categories">Toutes les catégories <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      {/* Best Sellers */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Meilleures Ventes</h2>
            <p className="text-slate-500">L'équipement de confiance de vos confrères.</p>
          </div>
          <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-slate-100">
            <Link href="/products">Tout voir <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>
        <ProductGridClient products={products} />
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 py-20 px-6 text-center shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Prêt à moderniser votre équipement ?
          </h2>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Rejoignez plus de 2,500 établissements de santé qui font confiance à Althea Systems pour leur approvisionnement critique.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 h-14 px-8 text-base font-semibold" asChild>
              <Link href="/signup">Ouvrir un compte pro</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white h-14 px-8 text-base" asChild>
              <Link href="/contact">Parler à un expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
