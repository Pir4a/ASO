import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private client: RedisClientType;
    private isConnected = false;

    // Default TTL in seconds
    private readonly DEFAULT_TTL = 300; // 5 minutes
    private readonly CATEGORIES_TTL = 3600; // 1 hour
    private readonly PRODUCTS_TTL = 600; // 10 minutes
    private readonly SEARCH_TTL = 300; // 5 minutes

    async onModuleInit() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = createClient({ url: redisUrl });

            this.client.on('error', (err) => {
                this.logger.error('Redis Client Error', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                this.logger.log('Redis Client Connected');
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            this.logger.warn('Redis connection failed, cache will be disabled', error);
            this.isConnected = false;
        }
    }

    async onModuleDestroy() {
        if (this.client && this.isConnected) {
            await this.client.quit();
        }
    }

    private isAvailable(): boolean {
        return this.isConnected && this.client?.isOpen;
    }

    // ============ Generic Cache Methods ============

    async get<T>(key: string): Promise<T | null> {
        if (!this.isAvailable()) return null;

        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            this.logger.error(`Cache get error for key ${key}`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            const ttl = ttlSeconds || this.DEFAULT_TTL;
            await this.client.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            this.logger.error(`Cache set error for key ${key}`, error);
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            await this.client.del(key);
        } catch (error) {
            this.logger.error(`Cache delete error for key ${key}`, error);
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        if (!this.isAvailable()) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            this.logger.error(`Cache deletePattern error for pattern ${pattern}`, error);
        }
    }

    // ============ Categories Cache ============

    async getCategories<T>(): Promise<T | null> {
        return this.get<T>('categories:all');
    }

    async setCategories(categories: any): Promise<void> {
        await this.set('categories:all', categories, this.CATEGORIES_TTL);
    }

    async invalidateCategories(): Promise<void> {
        await this.deletePattern('categories:*');
    }

    // ============ Products Cache ============

    async getProduct<T>(slug: string): Promise<T | null> {
        return this.get<T>(`product:${slug}`);
    }

    async setProduct(slug: string, product: any): Promise<void> {
        await this.set(`product:${slug}`, product, this.PRODUCTS_TTL);
    }

    async getProductsList<T>(cacheKey: string): Promise<T | null> {
        return this.get<T>(`products:list:${cacheKey}`);
    }

    async setProductsList(cacheKey: string, products: any): Promise<void> {
        await this.set(`products:list:${cacheKey}`, products, this.PRODUCTS_TTL);
    }

    async invalidateProducts(): Promise<void> {
        await this.deletePattern('product:*');
        await this.deletePattern('products:*');
    }

    async invalidateProduct(slug: string): Promise<void> {
        await this.delete(`product:${slug}`);
        // Also invalidate product lists
        await this.deletePattern('products:list:*');
    }

    // ============ Search Cache ============

    async getSearchResults<T>(query: string, filters: string): Promise<T | null> {
        const key = `search:${this.hashKey(query + filters)}`;
        return this.get<T>(key);
    }

    async setSearchResults(query: string, filters: string, results: any): Promise<void> {
        const key = `search:${this.hashKey(query + filters)}`;
        await this.set(key, results, this.SEARCH_TTL);
    }

    async invalidateSearch(): Promise<void> {
        await this.deletePattern('search:*');
    }

    // ============ Utility Methods ============

    private hashKey(str: string): string {
        // Simple hash for cache keys
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Cache-aside pattern helper
     * Tries to get from cache, if miss, calls factory and caches result
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds?: number
    ): Promise<T> {
        // Try cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Cache miss - get from source
        const value = await factory();

        // Store in cache
        await this.set(key, value, ttlSeconds);

        return value;
    }
}
