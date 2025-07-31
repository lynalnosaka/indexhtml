/**
 * Error Handler
 * Manages AJAX errors, CORS issues, and provides user-friendly error messages
 */

class ErrorHandler {
    constructor() {
        this.errorTypes = {
            NETWORK: 'network',
            CORS: 'cors',
            NOT_FOUND: 'not_found',
            SERVER_ERROR: 'server_error',
            TIMEOUT: 'timeout',
            PARSE: 'parse',
            QUOTA: 'quota',
            REDIS_FILE_DB: 'redis_file_db',
            STORAGE_MIGRATION: 'storage_migration'
        };
        
        this.init();
    }
    
    init() {
        this.bindGlobalErrorHandlers();
        this.log('ErrorHandler initialized');
    }
    
    bindGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
        });
        
        // Handle global AJAX errors
        $(document).ajaxError((event, xhr, settings, error) => {
            this.handleAjaxError(xhr, settings, error);
        });
    }
    
    handlePromiseRejection(reason) {
        this.log('Unhandled promise rejection:', reason);
        this.showError('An unexpected error occurred. Please try again.');
    }
    
    handleAjaxError(xhr, settings, error) {
        const errorType = this.determineErrorType(xhr, error);
        const errorInfo = this.createErrorInfo(errorType, xhr, settings, error);
        
        this.log('AJAX Error:', errorInfo);
        this.displayError(errorInfo);
    }
    
    determineErrorType(xhr, error) {
        if (xhr.status === 0) {
            return this.errorTypes.NETWORK;
        } else if (xhr.status === 404) {
            return this.errorTypes.NOT_FOUND;
        } else if (xhr.status >= 500) {
            return this.errorTypes.SERVER_ERROR;
        } else if (error === 'timeout') {
            return this.errorTypes.TIMEOUT;
        } else if (xhr.status === 0 && error.name === 'TypeError') {
            return this.errorTypes.CORS;
        } else if (xhr.status === 503 && error.message && error.message.includes('Redis')) {
            return this.errorTypes.REDIS_FILE_DB;
        } else if (xhr.status === 409 && error.message && error.message.includes('migration')) {
            return this.errorTypes.STORAGE_MIGRATION;
        } else {
            return this.errorTypes.NETWORK;
        }
    }
    
    createErrorInfo(type, xhr, settings, error) {
        return {
            type: type,
            status: xhr.status,
            statusText: xhr.statusText,
            url: settings.url,
            method: settings.type,
            error: error,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
    }
    
    displayError(errorInfo) {
        const errorHtml = this.generateErrorHtml(errorInfo);
        
        // Display in content area if available
        if ($('#content').length) {
            $('#content').html(errorHtml);
        } else {
            // Display as modal or notification
            this.showErrorModal(errorHtml);
        }
    }
    
    generateErrorHtml(errorInfo) {
        const baseError = `
            <div class="error-container">
                <div class="error-header">
                    <h2>${this.getErrorTitle(errorInfo.type)}</h2>
                </div>
                <div class="error-content">
                    <p>${this.getErrorMessage(errorInfo.type)}</p>
                    ${this.getErrorDetails(errorInfo)}
                    ${this.getErrorActions(errorInfo.type)}
                </div>
            </div>
        `;
        
        return baseError;
    }
    
    getErrorTitle(type) {
        const titles = {
            [this.errorTypes.NETWORK]: 'Network Error',
            [this.errorTypes.CORS]: 'CORS Error',
            [this.errorTypes.NOT_FOUND]: 'Content Not Found',
            [this.errorTypes.SERVER_ERROR]: 'Server Error',
            [this.errorTypes.TIMEOUT]: 'Request Timeout',
            [this.errorTypes.PARSE]: 'Data Parse Error',
            [this.errorTypes.QUOTA]: 'Storage Quota Exceeded',
            [this.errorTypes.REDIS_FILE_DB]: 'Redis File DB Error',
            [this.errorTypes.STORAGE_MIGRATION]: 'Storage Migration Error'
        };
        
        return titles[type] || 'Unknown Error';
    }
    
    getErrorMessage(type) {
        const messages = {
            [this.errorTypes.NETWORK]: 'Unable to connect to the server. Please check your internet connection and try again.',
            [this.errorTypes.CORS]: 'Request blocked by browser security policy. CORS configuration may be required.',
            [this.errorTypes.NOT_FOUND]: 'The requested content could not be found. It may have been moved or deleted.',
            [this.errorTypes.SERVER_ERROR]: 'The server encountered an error while processing your request. Please try again later.',
            [this.errorTypes.TIMEOUT]: 'The request took too long to complete. Please try again.',
            [this.errorTypes.PARSE]: 'Unable to parse the response data. The content may be corrupted.',
            [this.errorTypes.QUOTA]: 'Browser storage is full. Some data may be lost.',
            [this.errorTypes.REDIS_FILE_DB]: 'Redis File DB service is temporarily unavailable. Please try again later.',
            [this.errorTypes.STORAGE_MIGRATION]: 'Storage system is being migrated. Please try again in a few moments.'
        };
        
        return messages[type] || 'An unexpected error occurred. Please try again.';
    }
    
    getErrorDetails(errorInfo) {
        if (!SpacesConfig.debugMode) {
            return '';
        }
        
        return `
            <div class="error-details">
                <h3>Debug Information</h3>
                <p><strong>URL:</strong> ${errorInfo.url}</p>
                <p><strong>Method:</strong> ${errorInfo.method}</p>
                <p><strong>Status:</strong> ${errorInfo.status} ${errorInfo.statusText}</p>
                <p><strong>Time:</strong> ${errorInfo.timestamp}</p>
                ${errorInfo.error ? `<p><strong>Error:</strong> ${errorInfo.error.message || errorInfo.error}</p>` : ''}
            </div>
        `;
    }
    
    getErrorActions(type) {
        const actions = {
            [this.errorTypes.NETWORK]: `
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `,
            [this.errorTypes.CORS]: `
                <div class="error-actions">
                    <h3>CORS Configuration Required:</h3>
                    <pre>${this.getCorsConfigExample()}</pre>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `,
            [this.errorTypes.NOT_FOUND]: `
                <div class="error-actions">
                    <a href="/" class="nav-link btn btn-primary">Return to Home</a>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `,
            [this.errorTypes.SERVER_ERROR]: `
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `,
            [this.errorTypes.TIMEOUT]: `
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `,
            [this.errorTypes.PARSE]: `
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `,
            [this.errorTypes.QUOTA]: `
                <div class="error-actions">
                    <button onclick="StateManager.clearAllStates()" class="btn btn-warning">Clear Storage</button>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `,
            [this.errorTypes.REDIS_FILE_DB]: `
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="this.switchToSpacesStorage()" class="btn btn-secondary">Switch to Spaces</button>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `,
            [this.errorTypes.STORAGE_MIGRATION]: `
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
                </div>
            `
        };
        
        return actions[type] || `
            <div class="error-actions">
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                <button onclick="window.history.back()" class="btn btn-secondary">Go Back</button>
            </div>
        `;
    }
    
    getCorsConfigExample() {
        return JSON.stringify(SpacesConfig.getCorsConfig(), null, 2);
    }
    
    showErrorModal(content) {
        const modalHtml = `
            <div class="error-modal-overlay">
                <div class="error-modal">
                    <div class="error-modal-header">
                        <button class="error-modal-close" onclick="this.closest('.error-modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="error-modal-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
    }
    
    showError(message, type = 'info') {
        const notificationHtml = `
            <div class="notification notification-${type}">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
            </div>
        `;
        
        $('body').append(notificationHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            $(`.notification-${type}`).fadeOut(() => {
                $(this).remove();
            });
        }, 5000);
    }
    
    // Specific Error Handlers
    handleCorsError(url) {
        const errorInfo = {
            type: this.errorTypes.CORS,
            url: url,
            method: 'GET',
            status: 0,
            statusText: 'CORS Error'
        };
        
        this.displayError(errorInfo);
    }
    
    handleNotFoundError(url, path) {
        const errorInfo = {
            type: this.errorTypes.NOT_FOUND,
            url: url,
            method: 'GET',
            status: 404,
            statusText: 'Not Found',
            path: path
        };
        
        this.displayError(errorInfo);
    }
    
    handleTimeoutError(url) {
        const errorInfo = {
            type: this.errorTypes.TIMEOUT,
            url: url,
            method: 'GET',
            status: 0,
            statusText: 'Timeout'
        };
        
        this.displayError(errorInfo);
    }
    
    // Utility Methods
    log(message, data = null) {
        if (SpacesConfig.debugMode) {
            console.log(`[ErrorHandler] ${message}`, data || '');
        }
    }
    
    isNetworkError(error) {
        return error.type === this.errorTypes.NETWORK || 
               error.type === this.errorTypes.TIMEOUT;
    }
    
    isUserError(error) {
        return error.type === this.errorTypes.NOT_FOUND;
    }
    
    isServerError(error) {
        return error.type === this.errorTypes.SERVER_ERROR;
    }
    
    // Redis File DB specific methods
    switchToSpacesStorage() {
        if (SpacesConfig.redisFileDb) {
            SpacesConfig.redisFileDb.enabled = false;
            this.log('Switched to Spaces storage due to Redis File DB error');
            this.showError('Switched to Spaces storage. Please try again.', 'info');
            location.reload();
        }
    }
    
    handleRedisFileDbError(url) {
        this.log('Redis File DB error for URL:', url);
        this.showError('Redis File DB service is unavailable. Switching to Spaces storage.', 'warning');
        this.switchToSpacesStorage();
    }
}

// Create global instance
window.ErrorHandler = new ErrorHandler(); 