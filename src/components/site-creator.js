/**
 * Site Creator Component
 * Handles creation and management of new AJAX sites
 */

class SiteCreator {
    constructor() {
        this.currentSite = null;
        this.templates = [
            {
                id: 'blank',
                name: 'Blank Site',
                description: 'Start with a clean slate',
                icon: '📄'
            },
            {
                id: 'business',
                name: 'Business Site',
                description: 'Professional business website template',
                icon: '🏢'
            },
            {
                id: 'portfolio',
                name: 'Portfolio',
                description: 'Showcase your work and projects',
                icon: '🎨'
            },
            {
                id: 'blog',
                name: 'Blog',
                description: 'Personal or professional blog',
                icon: '📝'
            },
            {
                id: 'ecommerce',
                name: 'E-commerce',
                description: 'Online store template',
                icon: '🛒'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.log('SiteCreator initialized');
    }
    
    bindEvents() {
        // Site creation form events
        $(document).on('submit', '#siteCreationForm', (e) => {
            e.preventDefault();
            this.handleSiteCreation();
        });
        
        // Template selection events
        $(document).on('click', '.template-option', (e) => {
            this.selectTemplate($(e.currentTarget).data('template'));
        });
        
        // Subdomain validation events
        $(document).on('input', '#subdomainInput', (e) => {
            this.validateSubdomain($(e.target).val());
        });
        
        // File upload events
        $(document).on('change', '#siteFiles', (e) => {
            this.handleFileSelection(e.target.files);
        });
    }
    
    showCreateSiteModal() {
        const modalHtml = `
            <div class="modal-overlay" id="createSiteModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Create New Site</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="siteCreationForm">
                            <!-- Basic Information -->
                            <div class="form-section">
                                <h4>Basic Information</h4>
                                <div class="form-group">
                                    <label for="siteName">Site Name *</label>
                                    <input type="text" id="siteName" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label for="subdomainInput">Subdomain *</label>
                                    <div class="input-group">
                                        <input type="text" id="subdomainInput" class="form-control" required>
                                        <span class="input-group-text">.yourdomain.com</span>
                                    </div>
                                    <div class="subdomain-validation" id="subdomainValidation"></div>
                                </div>
                                <div class="form-group">
                                    <label for="siteDescription">Description</label>
                                    <textarea id="siteDescription" class="form-control" rows="3"></textarea>
                                </div>
                            </div>
                            
                            <!-- Template Selection -->
                            <div class="form-section">
                                <h4>Choose Template</h4>
                                <div class="template-grid" id="templateGrid">
                                    ${this.generateTemplateOptions()}
                                </div>
                            </div>
                            
                            <!-- File Upload -->
                            <div class="form-section">
                                <h4>Upload Files (Optional)</h4>
                                <div class="form-group">
                                    <label for="siteFiles">Select Files</label>
                                    <input type="file" id="siteFiles" class="form-control" multiple>
                                    <div class="file-list" id="fileList"></div>
                                </div>
                            </div>
                            
                            <!-- Advanced Options -->
                            <div class="form-section">
                                <h4>Advanced Options</h4>
                                <div class="form-group">
                                    <label for="enableSSL">Enable SSL</label>
                                    <div class="form-check">
                                        <input type="checkbox" id="enableSSL" class="form-check-input" checked>
                                        <label class="form-check-label" for="enableSSL">Use HTTPS</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="enableCDN">Enable CDN</label>
                                    <div class="form-check">
                                        <input type="checkbox" id="enableCDN" class="form-check-input" checked>
                                        <label class="form-check-label" for="enableCDN">Use Cloudflare CDN</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="customDomain">Custom Domain (Optional)</label>
                                    <input type="text" id="customDomain" class="form-control" placeholder="www.example.com">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" form="siteCreationForm" class="btn btn-primary">Create Site</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        // Initialize form
        this.initializeForm();
    }
    
    generateTemplateOptions() {
        return this.templates.map(template => `
            <div class="template-option" data-template="${template.id}">
                <div class="template-icon">${template.icon}</div>
                <div class="template-info">
                    <h5>${template.name}</h5>
                    <p>${template.description}</p>
                </div>
                <div class="template-check">
                    <input type="radio" name="template" value="${template.id}" ${template.id === 'blank' ? 'checked' : ''}>
                </div>
            </div>
        `).join('');
    }
    
    initializeForm() {
        // Set default values
        $('#siteName').focus();
        
        // Initialize subdomain validation
        this.validateSubdomain('');
        
        // Initialize template selection
        this.selectTemplate('blank');
    }
    
    selectTemplate(templateId) {
        // Update visual selection
        $('.template-option').removeClass('selected');
        $(`.template-option[data-template="${templateId}"]`).addClass('selected');
        
        // Update radio button
        $(`input[name="template"][value="${templateId}"]`).prop('checked', true);
        
        this.log(`Template selected: ${templateId}`);
    }
    
    validateSubdomain(subdomain) {
        const validation = $('#subdomainValidation');
        const input = $('#subdomainInput');
        
        // Clear previous validation
        validation.removeClass('valid invalid').empty();
        
        if (!subdomain) {
            validation.addClass('invalid').html('<span class="validation-message">Subdomain is required</span>');
            return false;
        }
        
        // Check length
        if (subdomain.length < 3) {
            validation.addClass('invalid').html('<span class="validation-message">Subdomain must be at least 3 characters</span>');
            return false;
        }
        
        if (subdomain.length > 63) {
            validation.addClass('invalid').html('<span class="validation-message">Subdomain must be less than 63 characters</span>');
            return false;
        }
        
        // Check format
        const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
        if (!subdomainRegex.test(subdomain)) {
            validation.addClass('invalid').html('<span class="validation-message">Subdomain can only contain lowercase letters, numbers, and hyphens</span>');
            return false;
        }
        
        // Check reserved words
        const reservedWords = ['www', 'mail', 'ftp', 'admin', 'api', 'cdn', 'static'];
        if (reservedWords.includes(subdomain)) {
            validation.addClass('invalid').html('<span class="validation-message">This subdomain is reserved</span>');
            return false;
        }
        
        // Check availability (simulate API call)
        this.checkSubdomainAvailability(subdomain);
        
        return true;
    }
    
    async checkSubdomainAvailability(subdomain) {
        const validation = $('#subdomainValidation');
        
        // Show checking state
        validation.addClass('checking').html('<span class="validation-message">Checking availability...</span>');
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock availability check
            const isAvailable = Math.random() > 0.3; // 70% chance of being available
            
            if (isAvailable) {
                validation.removeClass('checking').addClass('valid')
                    .html('<span class="validation-message">✓ Subdomain is available</span>');
            } else {
                validation.removeClass('checking').addClass('invalid')
                    .html('<span class="validation-message">✗ Subdomain is already taken</span>');
            }
        } catch (error) {
            validation.removeClass('checking').addClass('invalid')
                .html('<span class="validation-message">Error checking availability</span>');
        }
    }
    
    handleFileSelection(files) {
        const fileList = $('#fileList');
        fileList.empty();
        
        if (files.length === 0) {
            fileList.html('<p class="text-muted">No files selected</p>');
            return;
        }
        
        const fileItems = Array.from(files).map(file => `
            <div class="file-item">
                <span class="file-icon">${this.getFileIcon(file.name)}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
        `).join('');
        
        fileList.html(fileItems);
    }
    
    getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'html': '🌐',
            'htm': '🌐',
            'css': '🎨',
            'js': '⚡',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'svg': '🖼️',
            'pdf': '📄',
            'doc': '📄',
            'docx': '📄',
            'txt': '📄'
        };
        
        return iconMap[extension] || '📁';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async handleSiteCreation() {
        const form = $('#siteCreationForm')[0];
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Collect form data
        const formData = {
            siteName: $('#siteName').val(),
            subdomain: $('#subdomainInput').val(),
            description: $('#siteDescription').val(),
            template: $('input[name="template"]:checked').val(),
            enableSSL: $('#enableSSL').is(':checked'),
            enableCDN: $('#enableCDN').is(':checked'),
            customDomain: $('#customDomain').val()
        };
        
        // Validate subdomain
        if (!this.validateSubdomain(formData.subdomain)) {
            return;
        }
        
        // Show loading state
        this.showCreationProgress(formData);
        
        try {
            // Create site
            const result = await this.createSite(formData);
            
            // Handle success
            this.handleCreationSuccess(result);
            
        } catch (error) {
            // Handle error
            this.handleCreationError(error);
        }
    }
    
    showCreationProgress(formData) {
        const modal = $('#createSiteModal');
        const modalBody = modal.find('.modal-body');
        
        modalBody.html(`
            <div class="creation-progress">
                <h4>Creating Site: ${formData.siteName}</h4>
                <div class="progress-steps">
                    <div class="step active" data-step="1">
                        <span class="step-icon">📝</span>
                        <span class="step-text">Validating subdomain</span>
                    </div>
                    <div class="step" data-step="2">
                        <span class="step-icon">📁</span>
                        <span class="step-text">Creating directory structure</span>
                    </div>
                    <div class="step" data-step="3">
                        <span class="step-icon">📄</span>
                        <span class="step-text">Generating template files</span>
                    </div>
                    <div class="step" data-step="4">
                        <span class="step-icon">🔧</span>
                        <span class="step-text">Configuring settings</span>
                    </div>
                    <div class="step" data-step="5">
                        <span class="step-icon">✅</span>
                        <span class="step-text">Finalizing setup</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `);
        
        // Disable form submission
        modal.find('button[type="submit"]').prop('disabled', true);
    }
    
    updateCreationProgress(step, message = '') {
        const steps = $('.step');
        const progressFill = $('.progress-fill');
        
        // Update step states
        steps.each((index, stepEl) => {
            const stepNum = parseInt($(stepEl).data('step'));
            $(stepEl).removeClass('active completed');
            
            if (stepNum < step) {
                $(stepEl).addClass('completed');
            } else if (stepNum === step) {
                $(stepEl).addClass('active');
            }
        });
        
        // Update progress bar
        const progress = (step / 5) * 100;
        progressFill.css('width', `${progress}%`);
        
        // Update message if provided
        if (message) {
            $(`.step[data-step="${step}"] .step-text`).text(message);
        }
    }
    
    async createSite(formData) {
        // Simulate API call with progress updates
        this.updateCreationProgress(1, 'Validating subdomain...');
        await this.delay(1000);
        
        this.updateCreationProgress(2, 'Creating directory structure...');
        await this.delay(1500);
        
        // Use Redis File DB if enabled, otherwise fall back to Spaces
        const storageType = SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled ? 'Redis File DB' : 'Spaces';
        this.updateCreationProgress(3, `Generating template files (${storageType})...`);
        await this.delay(2000);
        
        this.updateCreationProgress(4, 'Configuring settings...');
        await this.delay(1000);
        
        this.updateCreationProgress(5, 'Finalizing setup...');
        await this.delay(1000);
        
        // Return mock result with storage type info
        return {
            success: true,
            siteId: 'site_' + Date.now(),
            subdomain: formData.subdomain,
            url: `https://${formData.subdomain}.yourdomain.com`,
            storageType: storageType,
            storagePath: SpacesConfig.redisFileDb && SpacesConfig.redisFileDb.enabled 
                ? `/ss/sd/${formData.subdomain}/`
                : `/ss/sd/${formData.subdomain}/`,
            message: 'Site created successfully!'
        };
    }
    
    handleCreationSuccess(result) {
        const modal = $('#createSiteModal');
        
        modal.find('.modal-body').html(`
            <div class="creation-success">
                <div class="success-icon">✅</div>
                <h4>Site Created Successfully!</h4>
                <p>Your new site is ready to use.</p>
                
                <div class="site-info">
                    <p><strong>Site Name:</strong> ${result.siteId}</p>
                    <p><strong>Subdomain:</strong> ${result.subdomain}</p>
                    <p><strong>URL:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
                    <p><strong>Storage Type:</strong> ${result.storageType}</p>
                    <p><strong>Storage Path:</strong> <code>${result.storagePath}</code></p>
                </div>
                
                <div class="next-steps">
                    <h5>Next Steps:</h5>
                    <ul>
                        <li>Upload your content files</li>
                        <li>Customize your site design</li>
                        <li>Configure SEO settings</li>
                        <li>Set up analytics</li>
                    </ul>
                </div>
            </div>
        `);
        
        modal.find('.modal-footer').html(`
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            <a href="${result.url}" target="_blank" class="btn btn-primary">View Site</a>
            <a href="/admin/sites/${result.siteId}" class="btn btn-success">Manage Site</a>
        `);
        
        // Trigger site list refresh
        $(document).trigger('siteCreated', [result]);
    }
    
    handleCreationError(error) {
        const modal = $('#createSiteModal');
        
        modal.find('.modal-body').html(`
            <div class="creation-error">
                <div class="error-icon">❌</div>
                <h4>Site Creation Failed</h4>
                <p>${error.message || 'An error occurred while creating your site.'}</p>
                
                <div class="error-details">
                    <h5>Error Details:</h5>
                    <pre>${JSON.stringify(error, null, 2)}</pre>
                </div>
            </div>
        `);
        
        modal.find('.modal-footer').html(`
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            <button type="button" class="btn btn-primary" onclick="location.reload()">Try Again</button>
        `);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    log(message, data = null) {
        if (SpacesConfig.debugMode) {
            console.log(`[SiteCreator] ${message}`, data || '');
        }
    }
}

// Create global instance
window.SiteCreator = new SiteCreator(); 