import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/categories",
    "/products",
    "/search",
    "/cart",
    "/checkout",
    "/account",
    "/login",
    "/signup",
    "/orders",
    "/settings",
    "/contact",
    "/chatbot",
    "/legal/cgu",
    "/legal/mentions",
    "/backoffice",
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    changefreq: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}

