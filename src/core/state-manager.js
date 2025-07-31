/**
 * State Manager
 * Handles localStorage operations, state persistence, and session management
 */

class StateManager {
    constructor() {
        this.storagePrefix = SpacesConfig.localStoragePrefix;
        this.maxStateAge = SpacesConfig.maxStateAge;
        this.init();
    }
    
    init() {
        this.cleanupExpiredStates();
        this.log('StateManager initialized');
    }
    
    // State Operations
    saveState(subdomain, path, data) {
        const key = this.getStateKey(subdomain, path);
        const state = {
            ...data,
            timestamp: Date.now(),
            subdomain: subdomain,
            path: path
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(state));
            this.log(`State saved: ${key}`);
            return true;
        } catch (error) {
            this.log(`Error saving state: ${error.message}`);
            this.handleStorageQuotaExceeded();
            return false;
        }
    }
    
    loadState(subdomain, path) {
        const key = this.getStateKey(subdomain, path);
        const stateData = localStorage.getItem(key);
        
        if (!stateData) {
            return null;
        }
        
        try {
            const state = JSON.parse(stateData);
            const age = Date.now() - state.timestamp;
            
            if (age > this.maxStateAge) {
                this.removeState(subdomain, path);
                this.log(`State expired: ${key}`);
                return null;
            }
            
            this.log(`State loaded: ${key}`);
            return state;
        } catch (error) {
            this.log(`Error parsing state: ${error.message}`);
            this.removeState(subdomain, path);
            return null;
        }
    }
    
    removeState(subdomain, path) {
        const key = this.getStateKey(subdomain, path);
        localStorage.removeItem(key);
        this.log(`State removed: ${key}`);
    }
    
    // Configuration Management
    saveConfig(config) {
        try {
            localStorage.setItem('spaces_config', JSON.stringify(config));
            this.log('Configuration saved');
            return true;
        } catch (error) {
            this.log(`Error saving config: ${error.message}`);
            return false;
        }
    }
    
    loadConfig() {
        const configData = localStorage.getItem('spaces_config');
        if (!configData) {
            return null;
        }
        
        try {
            const config = JSON.parse(configData);
            this.log('Configuration loaded');
            return config;
        } catch (error) {
            this.log(`Error parsing config: ${error.message}`);
            return null;
        }
    }
    
    // Subdomain Management
    saveCurrentSubdomain(subdomain) {
        try {
            localStorage.setItem('current_test_subdomain', subdomain);
            this.log(`Current subdomain saved: ${subdomain}`);
            return true;
        } catch (error) {
            this.log(`Error saving subdomain: ${error.message}`);
            return false;
        }
    }
    
    loadCurrentSubdomain() {
        const subdomain = localStorage.getItem('current_test_subdomain');
        if (subdomain) {
            this.log(`Current subdomain loaded: ${subdomain}`);
        }
        return subdomain;
    }
    
    // Session Management
    saveSessionData(key, data) {
        const sessionKey = `session_${key}`;
        try {
            localStorage.setItem(sessionKey, JSON.stringify(data));
            this.log(`Session data saved: ${sessionKey}`);
            return true;
        } catch (error) {
            this.log(`Error saving session data: ${error.message}`);
            return false;
        }
    }
    
    loadSessionData(key) {
        const sessionKey = `session_${key}`;
        const data = localStorage.getItem(sessionKey);
        
        if (!data) {
            return null;
        }
        
        try {
            const parsedData = JSON.parse(data);
            this.log(`Session data loaded: ${sessionKey}`);
            return parsedData;
        } catch (error) {
            this.log(`Error parsing session data: ${error.message}`);
            return null;
        }
    }
    
    removeSessionData(key) {
        const sessionKey = `session_${key}`;
        localStorage.removeItem(sessionKey);
        this.log(`Session data removed: ${sessionKey}`);
    }
    
    // Utility Methods
    getStateKey(subdomain, path) {
        // Include storage type in key to differentiate between old and new storage
        const storagePrefix = SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'redis_' : 'spaces_';
        return `${this.storagePrefix}${storagePrefix}${subdomain}${path}`;
    }
    
    getAllStates() {
        const states = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                try {
                    const state = JSON.parse(localStorage.getItem(key));
                    states.push({
                        key: key,
                        state: state
                    });
                } catch (error) {
                    this.log(`Error parsing state key ${key}: ${error.message}`);
                }
            }
        }
        return states;
    }
    
    getStatesForSubdomain(subdomain) {
        const states = this.getAllStates();
        return states.filter(item => item.state.subdomain === subdomain);
    }
    
    cleanupExpiredStates() {
        const states = this.getAllStates();
        let cleanedCount = 0;
        
        states.forEach(item => {
            const age = Date.now() - item.state.timestamp;
            if (age > this.maxStateAge) {
                localStorage.removeItem(item.key);
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            this.log(`Cleaned up ${cleanedCount} expired states`);
        }
    }
    
    clearAllStates() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        this.log(`Cleared ${keysToRemove.length} states`);
    }
    
    clearSubdomainStates(subdomain) {
        const states = this.getStatesForSubdomain(subdomain);
        states.forEach(item => {
            localStorage.removeItem(item.key);
        });
        this.log(`Cleared ${states.length} states for subdomain: ${subdomain}`);
    }
    
    // Storage Quota Management
    handleStorageQuotaExceeded() {
        this.log('Storage quota exceeded, cleaning up old states');
        
        // Remove oldest states first
        const states = this.getAllStates();
        states.sort((a, b) => a.state.timestamp - b.state.timestamp);
        
        // Remove 20% of oldest states
        const removeCount = Math.ceil(states.length * 0.2);
        for (let i = 0; i < removeCount; i++) {
            localStorage.removeItem(states[i].key);
        }
        
        this.log(`Removed ${removeCount} old states to free space`);
    }
    
    getStorageUsage() {
        const states = this.getAllStates();
        const totalSize = states.reduce((size, item) => {
            return size + JSON.stringify(item.state).length;
        }, 0);
        
        return {
            stateCount: states.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2)
        };
    }
    
    // Debug Methods
    log(message, data = null) {
        if (SpacesConfig.debugMode) {
            console.log(`[StateManager] ${message}`, data || '');
        }
    }
    
    debugStorage() {
        const usage = this.getStorageUsage();
        const states = this.getAllStates();
        
        console.group('StateManager Debug Info');
        console.log('Storage Usage:', usage);
        console.log('All States:', states);
        console.log('Current Subdomain:', this.loadCurrentSubdomain());
        console.log('Configuration:', this.loadConfig());
        console.groupEnd();
    }
}

// Create global instance
window.StateManager = new StateManager(); 