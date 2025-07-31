/**
 * URL Utilities
 * Handles path manipulation, subdomain processing, and URL construction
 */

class UrlUtils {
    constructor() {
        this.init();
    }
    
    init() {
        this.log('UrlUtils initialized');
    }
    
    // Path Manipulation
    normalizePath(path) {
        if (!path) return '/';
        
        // Remove leading/trailing slashes except for root
        let normalized = path.replace(/^\/+|\/+$/g, '');
        
        // Ensure root path is '/'
        if (normalized === '') {
            normalized = '/';
        } else {
            normalized = '/' + normalized;
        }
        
        return normalized;
    }
    
    joinPaths(...paths) {
        return paths
            .filter(path => path && path !== '')
            .map(path => path.replace(/^\/+|\/+$/g, ''))
            .join('/');
    }
    
    getPathSegments(path) {
        const normalized = this.normalizePath(path);
        return normalized === '/' ? [] : normalized.substring(1).split('/');
    }
    
    getPathDepth(path) {
        return this.getPathSegments(path).length;
    }
    
    getParentPath(path) {
        const segments = this.getPathSegments(path);
        if (segments.length === 0) return '/';
        
        segments.pop();
        return segments.length === 0 ? '/' : '/' + segments.join('/');
    }
    
    getFileName(path) {
        const segments = this.getPathSegments(path);
        return segments.length > 0 ? segments[segments.length - 1] : '';
    }
    
    getFileExtension(path) {
        const fileName = this.getFileName(path);
        const lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : '';
    }
    
    isRootPath(path) {
        return this.normalizePath(path) === '/';
    }
    
    isIndexPath(path) {
        const normalized = this.normalizePath(path);
        return normalized === '/' || normalized.endsWith('/index');
    }
    
    // Subdomain Handling
    extractSubdomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length < 3) return null;
        
        // Handle localhost for development
        if (hostname.includes('localhost')) {
            return parts[0] === 'localhost' ? null : parts[0];
        }
        
        return parts[0];
    }
    
    getCurrentSubdomain() {
        return this.extractSubdomain(window.location.hostname);
    }
    
    buildSubdomainUrl(subdomain, path = '/') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        let newHostname;
        if (hostname.includes('localhost')) {
            newHostname = subdomain + '.' + hostname;
        } else {
            const domainParts = hostname.split('.');
            if (domainParts.length >= 2) {
                newHostname = subdomain + '.' + domainParts.slice(-2).join('.');
            } else {
                newHostname = subdomain + '.' + hostname;
            }
        }
        
        const portString = port ? `:${port}` : '';
        return `${protocol}//${newHostname}${portString}${this.normalizePath(path)}`;
    }
    
    // URL Construction
    buildSpacesUrl(subdomain, path = '/') {
        const normalizedPath = this.normalizePath(path);
        const cleanPath = normalizedPath === '/' ? '' : normalizedPath.substring(1);
        
        // Use Redis File DB if enabled, otherwise fall back to Spaces
        if (SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled) {
            return SpacesConfig.getRedisFileDbUrl(subdomain, cleanPath);
        }
        
        return SpacesConfig.getSpacesUrl(subdomain, cleanPath);
    }
    
    buildApiUrl(endpoint) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/api/${endpoint}`;
    }
    
    // Redis File DB URL Construction Helpers
    buildRedisFileDbUrl(subdomain, path = '/') {
        if (!SpacesConfig.redisFileDb || !SpacesConfig.redisFileDb.enabled) {
            throw new Error('Redis File DB is not enabled in configuration');
        }
        
        const normalizedPath = this.normalizePath(path);
        const cleanPath = normalizedPath === '/' ? '' : normalizedPath.substring(1);
        
        return SpacesConfig.getRedisFileDbUrl(subdomain, cleanPath);
    }
    
    buildRedisFileDbSubdomainUrl(subdomain) {
        if (!SpacesConfig.redisFileDb || !SpacesConfig.redisFileDb.enabled) {
            throw new Error('Redis File DB is not enabled in configuration');
        }
        
        return SpacesConfig.redisFileDb.subdomainPath.replace('{subdomain}', subdomain);
    }
    
    buildAssetUrl(subdomain, assetPath) {
        const normalizedPath = this.normalizePath(assetPath);
        const cleanPath = normalizedPath === '/' ? '' : normalizedPath.substring(1);
        
        // Use Redis File DB if enabled, otherwise fall back to Spaces
        if (SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled) {
            return SpacesConfig.getRedisFileDbUrl(subdomain, `assets/${cleanPath}`);
        }
        
        return SpacesConfig.getSpacesUrl(subdomain, `assets/${cleanPath}`);
    }
    
    // Query String Handling
    parseQueryString(queryString) {
        const params = {};
        const query = queryString || window.location.search;
        
        if (!query) return params;
        
        const pairs = query.substring(1).split('&');
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }
    
    buildQueryString(params) {
        if (!params || Object.keys(params).length === 0) return '';
        
        const pairs = Object.entries(params)
            .filter(([key, value]) => key && value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        
        return pairs.length > 0 ? '?' + pairs.join('&') : '';
    }
    
    addQueryParam(url, key, value) {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set(key, value);
        return urlObj.toString();
    }
    
    removeQueryParam(url, key) {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.delete(key);
        return urlObj.toString();
    }
    
    // URL Validation
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    isExternalUrl(url) {
        if (!this.isValidUrl(url)) return false;
        
        const urlObj = new URL(url, window.location.origin);
        return urlObj.origin !== window.location.origin;
    }
    
    isMailtoUrl(url) {
        return url && url.startsWith('mailto:');
    }
    
    isTelUrl(url) {
        return url && url.startsWith('tel:');
    }
    
    isAnchorUrl(url) {
        return url && url.startsWith('#');
    }
    
    // Navigation URL Processing
    processNavigationUrl(url) {
        // Handle external URLs
        if (this.isExternalUrl(url)) {
            return { type: 'external', url: url };
        }
        
        // Handle mailto/tel URLs
        if (this.isMailtoUrl(url) || this.isTelUrl(url)) {
            return { type: 'protocol', url: url };
        }
        
        // Handle anchor URLs
        if (this.isAnchorUrl(url)) {
            return { type: 'anchor', url: url };
        }
        
        // Handle relative URLs
        const normalizedPath = this.normalizePath(url);
        return { type: 'internal', path: normalizedPath };
    }
    
    // Breadcrumb Generation
    generateBreadcrumbs(path) {
        const segments = this.getPathSegments(path);
        const breadcrumbs = [{ path: '/', name: 'Home' }];
        
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += '/' + segment;
            breadcrumbs.push({
                path: currentPath,
                name: this.formatBreadcrumbName(segment),
                isLast: index === segments.length - 1
            });
        });
        
        return breadcrumbs;
    }
    
    formatBreadcrumbName(segment) {
        // Convert kebab-case or snake_case to Title Case
        return segment
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // File Type Detection
    getFileType(path) {
        const extension = this.getFileExtension(path).toLowerCase();
        
        const fileTypes = {
            // Images
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
            'svg': 'image', 'webp': 'image', 'ico': 'image',
            
            // Documents
            'pdf': 'document', 'doc': 'document', 'docx': 'document',
            'txt': 'document', 'rtf': 'document',
            
            // Web
            'html': 'web', 'htm': 'web', 'css': 'web', 'js': 'web',
            
            // Media
            'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video',
            'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
            
            // Archives
            'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive',
            
            // Data
            'json': 'data', 'xml': 'data', 'csv': 'data'
        };
        
        return fileTypes[extension] || 'unknown';
    }
    
    isImageFile(path) {
        return this.getFileType(path) === 'image';
    }
    
    isDocumentFile(path) {
        return this.getFileType(path) === 'document';
    }
    
    isWebFile(path) {
        return this.getFileType(path) === 'web';
    }
    
    // Utility Methods
    log(message, data = null) {
        if (SpacesConfig.debugMode) {
            console.log(`[UrlUtils] ${message}`, data || '');
        }
    }
    
    // Debug Methods
    debugUrl(url) {
        const info = {
            original: url,
            normalized: this.normalizePath(url),
            segments: this.getPathSegments(url),
            depth: this.getPathDepth(url),
            parent: this.getParentPath(url),
            fileName: this.getFileName(url),
            extension: this.getFileExtension(url),
            isRoot: this.isRootPath(url),
            isIndex: this.isIndexPath(url),
            fileType: this.getFileType(url),
            breadcrumbs: this.generateBreadcrumbs(url)
        };
        
        this.log('URL Debug Info:', info);
        return info;
    }
}

// Create global instance
window.UrlUtils = new UrlUtils(); 