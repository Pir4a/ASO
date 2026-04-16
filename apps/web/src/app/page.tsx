import { Carousel } from "@/components/home/Carousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductGridClient } from "@/components/home/ProductGridClient";
import { getHomepageData } from "@/lib/api";

export default async function Home() {
  const { categories, products, slides } = await getHomepageData();

  return (
    <div className="space-y-10">
      <section className="py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-bold text-primary shadow-sm ring-1 ring-slate-200/50">
              Trusted by <span className="ml-1 text-success">500+ Healthcare Professionals</span>
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Premium Medical Equipment, Delivered with Excellence.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              Althea Systems is your trusted partner for high-quality medical devices and
              equipment. From imaging systems to surgical instruments — we help healthcare
              professionals deliver the best patient care.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm">
                Express Delivery Available
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                EU-Certified Devices
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                24/7 Expert Support
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
            <h3 className="mb-4 font-bold text-foreground">Why Althea Systems?</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                ISO 13485 Certified Equipment
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                Competitive Pricing Across Europe
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                Dedicated Account Managers
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Free Shipping Over 150€
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">What&apos;s New</h2>
          <p className="text-sm text-slate-600">Latest promotions and arrivals.</p>
        </div>
        <Carousel slides={slides} />
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Shop by Category</h2>
          <p className="text-sm text-slate-600">Browse our specialized product ranges.</p>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Best Sellers</h2>
          <p className="text-sm text-slate-600">Top-rated equipment chosen by professionals.</p>
        </div>
        <ProductGridClient products={products} />
      </section>

      <section className="card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">Ready to place your order?</p>
            <p className="text-sm text-slate-600">
              Secure checkout, competitive pricing, and fast delivery across Europe.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/checkout"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
            >
              Proceed to Checkout
            </a>
            <a
              href="/contact"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary"
            >
              Talk to an Expert
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
