/**
 * DigitalOcean Spaces Configuration
 * Manages bucket settings, CORS, and AJAX behavior
 * 
 * SECURITY NOTE: This file contains ONLY public configuration.
 * NEVER put private credentials (access keys, secret keys, API tokens) in this file.
 * Private authentication should be handled server-side.
 */

const SpacesConfig = {
    // DigitalOcean Spaces Configuration
    bucket: "your-bucket-name",
    region: "nyc3",
    directory: "/ss/sd/",
    basePath: "",
    
    // Redis File DB Configuration
    redisFileDb: {
        enabled: true,
        basePath: "/ss/sd/",
        subdomainPath: "/ss/sd/{subdomain}/",
        apiEndpoint: "http://localhost:8080"
    },
    
    // AJAX Behavior Settings
    debugMode: true,
    demoMode: false,
    cacheEnabled: true,
    cacheExpiry: 300000, // 5 minutes in milliseconds
    
    // CORS Configuration
    corsOrigins: ["https://yourdomain.com", "http://localhost:3000"],
    corsMethods: ["GET", "HEAD"],
    corsHeaders: ["*"],
    corsMaxAge: 3000,
    
    // Performance Settings
    requestTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    
    // State Management
    localStoragePrefix: "state_",
    maxStateAge: 3600000, // 1 hour in milliseconds
    
    // URL Construction
    getSpacesUrl: function(subdomain, path = "") {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        const fullPath = this.directory + subdomain + "/" + cleanPath;
        return `https://${this.bucket}.${this.region}.digitaloceanspaces.com${fullPath}`;
    },
    
    // Redis File DB URL Construction
    getRedisFileDbUrl: function(subdomain, path = "") {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        const fullPath = this.redisFileDb.subdomainPath.replace('{subdomain}', subdomain) + cleanPath;
        return `${this.redisFileDb.apiEndpoint}${fullPath}`;
    },
    
    // CORS Configuration Helper
    getCorsConfig: function() {
        return [{
            AllowedOrigins: this.corsOrigins,
            AllowedMethods: this.corsMethods,
            AllowedHeaders: this.corsHeaders,
            MaxAgeSeconds: this.corsMaxAge
        }];
    },
    
    // Validation
    validateConfig: function() {
        const required = ['bucket', 'region', 'directory'];
        for (const field of required) {
            if (!this[field]) {
                throw new Error(`Missing required config field: ${field}`);
            }
        }
        
        // Validate Redis File DB configuration
        if (this.redisFileDb && this.redisFileDb.enabled) {
            const redisRequired = ['basePath', 'subdomainPath', 'apiEndpoint'];
            for (const field of redisRequired) {
                if (!this.redisFileDb[field]) {
                    throw new Error(`Missing required Redis File DB config field: ${field}`);
                }
            }
        }
        
        return true;
    },
    
    // Debug Logging
    log: function(message, data = null) {
        if (this.debugMode) {
            console.log(`[SpacesConfig] ${message}`, data || '');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpacesConfig;
} 