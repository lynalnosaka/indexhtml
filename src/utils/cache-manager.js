/**
 * Cache Manager
 * Handles content caching, storage management, and cache invalidation
 */

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.metadata = new Map();
        this.maxSize = 50; // Maximum number of cached items
        this.maxAge = SpacesConfig.cacheExpiry || 300000; // 5 minutes default
        this.init();
    }
    
    init() {
        this.loadPersistentCache();
        this.startCleanupInterval();
        this.log('CacheManager initialized');
    }
    
    // Cache Operations
    set(key, content, metadata = {}) {
        const cacheItem = {
            content: content,
            metadata: {
                ...metadata,
                timestamp: Date.now(),
                size: this.calculateSize(content)
            }
        };
        
        // Check if we need to evict items
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        
        this.cache.set(key, cacheItem);
        this.metadata.set(key, cacheItem.metadata);
        
        // Save to persistent storage
        this.saveToPersistentStorage(key, cacheItem);
        
        this.log(`Content cached: ${key}`);
        return true;
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }
        
        // Check if item has expired
        if (this.isExpired(item.metadata.timestamp)) {
            this.delete(key);
            return null;
        }
        
        // Update access time
        item.metadata.lastAccessed = Date.now();
        this.metadata.set(key, item.metadata);
        
        this.log(`Content retrieved from cache: ${key}`);
        return item.content;
    }
    
    delete(key) {
        this.cache.delete(key);
        this.metadata.delete(key);
        this.removeFromPersistentStorage(key);
        
        this.log(`Content removed from cache: ${key}`);
    }
    
    clear() {
        this.cache.clear();
        this.metadata.clear();
        this.clearPersistentStorage();
        
        this.log('Cache cleared');
    }
    
    // Cache Validation
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        if (this.isExpired(item.metadata.timestamp)) {
            this.delete(key);
            return false;
        }
        
        return true;
    }
    
    isExpired(timestamp) {
        return Date.now() - timestamp > this.maxAge;
    }
    
    // Cache Statistics
    getStats() {
        const items = Array.from(this.cache.values());
        const totalSize = items.reduce((size, item) => size + item.metadata.size, 0);
        const avgAge = items.length > 0 ? 
            items.reduce((sum, item) => sum + (Date.now() - item.metadata.timestamp), 0) / items.length : 0;
        
        return {
            itemCount: this.cache.size,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            averageAge: avgAge,
            averageAgeSeconds: (avgAge / 1000).toFixed(1),
            maxSize: this.maxSize,
            maxAge: this.maxAge
        };
    }
    
    // Cache Management
    evictOldest() {
        if (this.cache.size === 0) return;
        
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (item.metadata.timestamp < oldestTime) {
                oldestTime = item.metadata.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.delete(oldestKey);
        }
    }
    
    evictExpired() {
        const expiredKeys = [];
        
        for (const [key, item] of this.cache.entries()) {
            if (this.isExpired(item.metadata.timestamp)) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.delete(key));
        
        if (expiredKeys.length > 0) {
            this.log(`Evicted ${expiredKeys.length} expired items`);
        }
    }
    
    // Subdomain-specific Operations
    clearSubdomainCache(subdomain) {
        const keysToRemove = [];
        
        for (const key of this.cache.keys()) {
            if (key.includes(subdomain)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => this.delete(key));
        
        // Also clear persistent storage for this subdomain
        const storageKeys = Object.keys(localStorage);
        const subdomainCacheKeys = storageKeys.filter(key => 
            key.startsWith('cache_') && key.includes(subdomain)
        );
        
        subdomainCacheKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        this.log(`Cleared cache for subdomain: ${subdomain}`);
    }
    
    getSubdomainStats(subdomain) {
        const items = Array.from(this.cache.entries())
            .filter(([key]) => key.includes(subdomain));
        
        const totalSize = items.reduce((size, [key, item]) => size + item.metadata.size, 0);
        
        return {
            itemCount: items.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2)
        };
    }
    
    // Persistent Storage
    saveToPersistentStorage(key, item) {
        try {
            const storageKey = `cache_${key}`;
            const data = {
                content: item.content,
                metadata: item.metadata
            };
            
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
            this.log(`Error saving to persistent storage: ${error.message}`);
        }
    }
    
    loadFromPersistentStorage(key) {
        try {
            const storageKey = `cache_${key}`;
            const data = localStorage.getItem(storageKey);
            
            if (data) {
                const item = JSON.parse(data);
                
                // Check if item has expired
                if (!this.isExpired(item.metadata.timestamp)) {
                    this.cache.set(key, item);
                    this.metadata.set(key, item.metadata);
                    return item;
                } else {
                    this.removeFromPersistentStorage(key);
                }
            }
        } catch (error) {
            this.log(`Error loading from persistent storage: ${error.message}`);
        }
        
        return null;
    }
    
    removeFromPersistentStorage(key) {
        try {
            const storageKey = `cache_${key}`;
            localStorage.removeItem(storageKey);
        } catch (error) {
            this.log(`Error removing from persistent storage: ${error.message}`);
        }
    }
    
    loadPersistentCache() {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        
        let loadedCount = 0;
        cacheKeys.forEach(storageKey => {
            const key = storageKey.substring(6); // Remove 'cache_' prefix
            const item = this.loadFromPersistentStorage(key);
            
            if (item) {
                loadedCount++;
            }
        });
        
        if (loadedCount > 0) {
            this.log(`Loaded ${loadedCount} items from persistent storage`);
        }
    }
    
    clearPersistentStorage() {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        
        cacheKeys.forEach(key => localStorage.removeItem(key));
        
        this.log(`Cleared ${cacheKeys.length} items from persistent storage`);
    }
    
    // Utility Methods
    calculateSize(content) {
        return typeof content === 'string' ? content.length : JSON.stringify(content).length;
    }
    
    startCleanupInterval() {
        // Clean up expired items every 5 minutes
        setInterval(() => {
            this.evictExpired();
        }, 300000);
    }
    
    // Cache Warming
    warmCache(subdomain, paths) {
        this.log(`Warming cache for subdomain: ${subdomain}`);
        
        paths.forEach(path => {
            const key = `${subdomain}:${path}`;
            if (!this.has(key)) {
                // Pre-fetch content
                this.prefetchContent(subdomain, path);
            }
        });
    }
    
    async prefetchContent(subdomain, path) {
        try {
            // Use Redis File DB if enabled, otherwise fall back to Spaces
            let url;
            if (SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled) {
                url = SpacesConfig.getRedisFileDbUrl(subdomain, path);
            } else {
                url = SpacesConfig.getSpacesUrl(subdomain, path);
            }
            
            const response = await fetch(url);
            
            if (response.ok) {
                const content = await response.text();
                const key = `${subdomain}:${path}`;
                
                this.set(key, content, {
                    subdomain: subdomain,
                    path: path,
                    prefetched: true,
                    storageType: SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'redis' : 'spaces'
                });
                
                this.log(`Content prefetched: ${key}`);
            }
        } catch (error) {
            this.log(`Error prefetching content: ${error.message}`);
        }
    }
    
    // Debug Methods
    log(message, data = null) {
        if (SpacesConfig.debugMode) {
            console.log(`[CacheManager] ${message}`, data || '');
        }
    }
    
    debugCache() {
        const stats = this.getStats();
        const items = Array.from(this.cache.entries()).map(([key, item]) => ({
            key: key,
            size: item.metadata.size,
            age: Date.now() - item.metadata.timestamp,
            lastAccessed: item.metadata.lastAccessed
        }));
        
        console.group('CacheManager Debug Info');
        console.log('Statistics:', stats);
        console.log('Cached Items:', items);
        console.groupEnd();
    }
    
    // Performance Monitoring
    getPerformanceMetrics() {
        const stats = this.getStats();
        const hitRate = this.calculateHitRate();
        
        return {
            ...stats,
            hitRate: hitRate,
            efficiency: this.calculateEfficiency()
        };
    }
    
    calculateHitRate() {
        // This would need to be implemented with hit/miss tracking
        return 0.85; // Placeholder
    }
    
    calculateEfficiency() {
        const stats = this.getStats();
        return stats.itemCount / stats.maxSize;
    }
}

// Create global instance
window.CacheManager = new CacheManager(); 