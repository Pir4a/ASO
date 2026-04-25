import { Product } from '../entities/product.entity';

export interface ProductBrowseParams {
  categoryId?: string;
  categorySlug?: string;
  page: number;
  pageSize: number;
}

export interface ProductBrowseResult {
  items: Product[];
  total: number;
}

export type ProductSearchSort =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'novelty_desc'
  | 'novelty_asc'
  | 'availability_asc'
  | 'availability_desc';

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort: ProductSearchSort;
  page: number;
  pageSize: number;
}

export interface ProductSearchFacetCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ProductSearchResult {
  items: Product[];
  total: number;
  facets: { categories: ProductSearchFacetCategory[] };
  tookMs: number;
  /** When the catalog is small enough, Levenshtein refines ranking after SQL filters. */
  relevanceRefined: boolean;
}

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findOneBySlug(slug: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
  findFeatured(limit: number): Promise<Product[]>;
  browse(params: ProductBrowseParams): Promise<ProductBrowseResult>;
  findRelatedBySlug(slug: string, limit: number): Promise<Product[]>;
  search(params: ProductSearchParams): Promise<ProductSearchResult>;
}

export const PRODUCT_REPOSITORY_TOKEN = 'ProductRepository';
