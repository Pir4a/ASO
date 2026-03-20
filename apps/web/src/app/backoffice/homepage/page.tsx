"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  order: number;
}

interface HomepageContent {
  carousel: CarouselSlide[];
  hero?: any;
  features?: any;
  cta?: any;
  featuredProducts?: any;
  featuredCategories?: any;
}

export default function HomepageAdminPage() {
  const [content, setContent] = useState<HomepageContent>({
    carousel: [],
    hero: null,
    features: null,
    cta: null,
    featuredProducts: null,
    featuredCategories: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    loadContent(storedToken);
  }, []);

  const loadContent = async (authToken: string | null) => {
    if (!authToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/content/homepage`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/content/homepage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });

      if (res.ok) {
        alert("Contenu sauvegardé avec succès !");
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addCarouselSlide = () => {
    const newSlide: CarouselSlide = {
      id: `slide-${Date.now()}`,
      title: "Nouveau slide",
      subtitle: "",
      imageUrl: "",
      order: content.carousel.length,
    };
    setContent(prev => ({
      ...prev,
      carousel: [...prev.carousel, newSlide],
    }));
  };

  const updateCarouselSlide = (index: number, field: keyof CarouselSlide, value: any) => {
    const updatedSlides = [...content.carousel];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setContent(prev => ({ ...prev, carousel: updatedSlides }));
  };

  const removeCarouselSlide = (index: number) => {
    const updatedSlides = content.carousel.filter((_, i) => i !== index);
    setContent(prev => ({ ...prev, carousel: updatedSlides }));
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Chargement...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion de la Page d'Accueil</h1>
            <p className="text-slate-600 mt-1">Modifiez tous les éléments de votre page d'accueil</p>
          </div>
          <button
            onClick={saveContent}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>

        {/* Carousel Section */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Carrousel</h2>
            <button
              onClick={addCarouselSlide}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Ajouter un slide
            </button>
          </div>

          <div className="space-y-4">
            {content.carousel.map((slide, index) => (
              <div key={slide.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Slide {index + 1}</h3>
                  <button
                    onClick={() => removeCarouselSlide(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => updateCarouselSlide(index, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Sous-titre
                    </label>
                    <input
                      type="text"
                      value={slide.subtitle || ""}
                      onChange={(e) => updateCarouselSlide(index, "subtitle", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      URL de l'image
                    </label>
                    <input
                      type="url"
                      value={slide.imageUrl}
                      onChange={(e) => updateCarouselSlide(index, "imageUrl", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))}

            {content.carousel.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Aucun slide dans le carrousel. Cliquez sur "Ajouter un slide" pour commencer.
              </div>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Section Héro</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titre principal
              </label>
              <textarea
                rows={3}
                value={content.hero?.title || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  hero: { ...prev.hero, title: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="L'excellence médicale réinventée."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={content.hero?.description || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  hero: { ...prev.hero, description: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Equipez votre établissement avec..."
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Section Fonctionnalités</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titre de la section
              </label>
              <input
                type="text"
                value={content.features?.title || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  features: { ...prev.features, title: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Pourquoi choisir Althea ?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sous-titre
              </label>
              <input
                type="text"
                value={content.features?.subtitle || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  features: { ...prev.features, subtitle: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Une excellence opérationnelle à chaque étape."
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Section Call-to-Action</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titre
              </label>
              <textarea
                rows={2}
                value={content.cta?.title || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  cta: { ...prev.cta, title: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Prêt à moderniser votre équipement ?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={content.cta?.description || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  cta: { ...prev.cta, description: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Rejoignez plus de 2,500 établissements..."
              />
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Produits en Vedette</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titre de la section
              </label>
              <input
                type="text"
                value={content.featuredProducts?.title || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  featuredProducts: { ...prev.featuredProducts, title: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Sélection Expert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={content.featuredProducts?.description || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  featuredProducts: { ...prev.featuredProducts, description: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Les produits les plus recommandés par nos spécialistes."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                IDs des produits (séparés par des virgules)
              </label>
              <input
                type="text"
                value={content.featuredProducts?.productIds?.join(', ') || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  featuredProducts: {
                    ...prev.featuredProducts,
                    productIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                  }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="product-id-1, product-id-2, product-id-3"
              />
            </div>
          </div>
        </div>

        {/* Featured Categories */}
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Catégories en Vedette</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Titre de la section
              </label>
              <input
                type="text"
                value={content.featuredCategories?.title || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  featuredCategories: { ...prev.featuredCategories, title: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Parcourir par Spécialité"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                IDs des catégories (séparés par des virgules)
              </label>
              <input
                type="text"
                value={content.featuredCategories?.categoryIds?.join(', ') || ""}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  featuredCategories: {
                    ...prev.featuredCategories,
                    categoryIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                  }
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="category-id-1, category-id-2, category-id-3"
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}