/**
 * Navigation Manager
 * Handles AJAX content loading, History.js integration, and state management
 */

class NavigationManager {
    constructor() {
        this.currentSubdomain = null;
        this.currentPath = '/';
        this.isLoading = false;
        this.contentCache = new Map();
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadInitialState();
        this.log('NavigationManager initialized');
    }
    
    bindEvents() {
        // Bind navigation link clicks
        $(document).on('click', '.nav-link', (e) => {
            e.preventDefault();
            const href = $(e.currentTarget).attr('href');
            this.navigateTo(href);
        });
        
        // Bind History.js state changes
        if (window.History) {
            window.History.Adapter.bind(window, 'statechange', () => {
                const state = window.History.getState().data;
                if (state && state.path) {
                    this.loadContent(state.path, false);
                }
            });
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.path) {
                this.loadContent(e.state.path, false);
            }
        });
    }
    
    loadInitialState() {
        const currentPath = window.location.pathname;
        this.currentPath = currentPath === '' ? '/' : currentPath;
        this.loadContent(this.currentPath, false);
    }
    
    navigateTo(path) {
        this.log(`Navigating to: ${path}`);
        
        // Update URL with History.js
        if (window.History && window.History.pushState) {
            window.History.pushState({ path: path }, '', path);
        } else {
            window.history.pushState({ path: path }, '', path);
        }
        
        // Load content
        this.loadContent(path, true);
    }
    
    async loadContent(path, updateHistory = true) {
        if (this.isLoading) {
            this.log('Navigation already in progress, skipping');
            return;
        }
        
        this.isLoading = true;
        this.currentPath = path;
        
        try {
            // Show loading state
            this.showLoading();
            
            // Check cache first
            const cachedContent = this.getCachedContent(path);
            if (cachedContent) {
                this.log('Using cached content');
                this.displayContent(cachedContent);
                this.isLoading = false;
                return;
            }
            
            // Load content from server
            const content = await this.fetchContent(path);
            if (content) {
                this.cacheContent(path, content);
                this.displayContent(content);
            }
            
        } catch (error) {
            this.handleError(error, path);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async fetchContent(path) {
        // Use Redis File DB if enabled, otherwise fall back to Spaces
        let url;
        if (SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled) {
            url = SpacesConfig.getRedisFileDbUrl(this.currentSubdomain, path);
        } else {
            url = SpacesConfig.getSpacesUrl(this.currentSubdomain, path);
        }
        
        this.log(`Fetching content from: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: SpacesConfig.requestTimeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        return content;
    }
    
    displayContent(content) {
        // Update the main content area
        $('#content').html(content);
        
        // Update active navigation state
        this.updateActiveNavigation();
        
        // Re-bind dynamic content
        this.bindDynamicContent();
        
        // Save state to localStorage
        this.saveState();
        
        // Trigger content loaded event
        $(document).trigger('contentLoaded', [this.currentPath, content]);
        
        this.log('Content displayed successfully');
    }
    
    updateActiveNavigation() {
        // Remove active class from all nav links
        $('.nav-link').removeClass('active');
        
        // Add active class to current page link
        $(`.nav-link[href="${this.currentPath}"]`).addClass('active');
    }
    
    bindDynamicContent() {
        // Re-bind form submissions
        $('#content form').off('submit').on('submit', (e) => {
            this.handleFormSubmit(e);
        });
        
        // Re-bind button clicks
        $('#content button').off('click').on('click', (e) => {
            this.handleButtonClick(e);
        });
        
        // Re-bind any other dynamic elements
        $('#content [data-action]').off('click').on('click', (e) => {
            this.handleDataAction(e);
        });
    }
    
    handleFormSubmit(e) {
        const form = $(e.currentTarget);
        const action = form.attr('action');
        const method = form.attr('method') || 'POST';
        
        this.log(`Form submitted: ${method} ${action}`);
        
        // Handle form submission logic here
        // This can be extended based on specific form requirements
    }
    
    handleButtonClick(e) {
        const button = $(e.currentTarget);
        const action = button.data('action');
        
        this.log(`Button clicked: ${action}`);
        
        // Handle button click logic here
    }
    
    handleDataAction(e) {
        const element = $(e.currentTarget);
        const action = element.data('action');
        
        this.log(`Data action triggered: ${action}`);
        
        // Handle data-action logic here
    }
    
    showLoading() {
        $('#content').html('<div class="loading">Loading content...</div>');
    }
    
    hideLoading() {
        $('.loading').remove();
    }
    
    handleError(error, path) {
        this.log(`Error loading content: ${error.message}`);
        
        const errorHtml = `
            <div class="error">
                <h2>Content Not Found</h2>
                <p>The requested page could not be loaded.</p>
                <p><strong>URL:</strong> ${SpacesConfig.getSpacesUrl(this.currentSubdomain, path)}</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Subdomain:</strong> ${this.currentSubdomain}</p>
                <p><strong>Path:</strong> ${path}</p>
                <a href="/" class="nav-link">Return to Home</a>
            </div>
        `;
        
        $('#content').html(errorHtml);
    }
    
    // State Management
    saveState() {
        const state = {
            content: $('#content').html(),
            url: window.location.href,
            scroll: window.scrollY,
            timestamp: Date.now(),
            demo: SpacesConfig.demoMode,
            storageType: SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'redis' : 'spaces'
        };
        
        // Include storage type in key to differentiate between old and new storage
        const storagePrefix = SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'redis_' : 'spaces_';
        const key = `${SpacesConfig.localStoragePrefix}${storagePrefix}${this.currentSubdomain}${this.currentPath}`;
        localStorage.setItem(key, JSON.stringify(state));
        
        this.log('State saved to localStorage');
    }
    
    loadState(path) {
        // Try to load from current storage type first
        const storagePrefix = SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'redis_' : 'spaces_';
        const key = `${SpacesConfig.localStoragePrefix}${storagePrefix}${this.currentSubdomain}${path}`;
        const stateData = localStorage.getItem(key);
        
        if (stateData) {
            try {
                const state = JSON.parse(stateData);
                const age = Date.now() - state.timestamp;
                
                if (age < SpacesConfig.maxStateAge) {
                    this.log('Loading state from localStorage');
                    return state;
                } else {
                    localStorage.removeItem(key);
                    this.log('State expired, removed from localStorage');
                }
            } catch (error) {
                this.log('Error parsing state data');
                localStorage.removeItem(key);
            }
        }
        
        // Fallback: try to load from old storage type
        const fallbackPrefix = SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'spaces_' : 'redis_';
        const fallbackKey = `${SpacesConfig.localStoragePrefix}${fallbackPrefix}${this.currentSubdomain}${path}`;
        const fallbackData = localStorage.getItem(fallbackKey);
        
        if (fallbackData) {
            try {
                const state = JSON.parse(fallbackData);
                const age = Date.now() - state.timestamp;
                
                if (age < SpacesConfig.maxStateAge) {
                    this.log('Loading fallback state from localStorage');
                    return state;
                } else {
                    localStorage.removeItem(fallbackKey);
                    this.log('Fallback state expired, removed from localStorage');
                }
            } catch (error) {
                this.log('Error parsing fallback state data');
                localStorage.removeItem(fallbackKey);
            }
        }
        
        return null;
    }
    
    // Caching
    cacheContent(path, content) {
        if (SpacesConfig.cacheEnabled) {
            this.contentCache.set(path, {
                content: content,
                timestamp: Date.now()
            });
        }
    }
    
    getCachedContent(path) {
        if (!SpacesConfig.cacheEnabled) return null;
        
        const cached = this.contentCache.get(path);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < SpacesConfig.cacheExpiry) {
                return cached.content;
            } else {
                this.contentCache.delete(path);
            }
        }
        
        return null;
    }
    
    // Utility methods
    setSubdomain(subdomain) {
        this.currentSubdomain = subdomain;
        this.log(`Subdomain set to: ${subdomain}`);
    }
    
    getCurrentPath() {
        return this.currentPath;
    }
    
    getCurrentSubdomain() {
        return this.currentSubdomain;
    }
    
    log(message, data = null) {
        if (SpacesConfig.debugMode) {
            console.log(`[NavigationManager] ${message}`, data || '');
        }
    }
}

// Create global instance
window.NavigationManager = new NavigationManager(); 