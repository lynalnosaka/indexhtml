# AJAX Frontend - MyAiSpace

A modern, responsive web application for managing AJAX-based subdomain sites with seamless navigation and state management.

## 🚀 Features

- **AJAX Navigation**: Instant page transitions with History.js integration
- **State Management**: Persistent state storage with localStorage
- **Responsive Design**: Mobile-first design that works on all devices
- **Component Architecture**: Modular, maintainable code structure
- **Error Handling**: Comprehensive error management and user feedback
- **Caching System**: Intelligent content caching for performance
- **Admin Panel**: Complete site management interface
- **Template System**: Pre-built templates for quick site creation

## 📁 Project Structure

```
frontend-ajax/
├── config/
│   └── spaces-config.js          # DigitalOcean Spaces configuration
├── core/
│   ├── navigation-manager.js     # AJAX navigation and History.js integration
│   ├── state-manager.js          # localStorage and state persistence
│   └── error-handler.js          # Error handling and user feedback
├── utils/
│   ├── url-utils.js              # URL manipulation and validation
│   └── cache-manager.js          # Content caching and storage management
├── components/
│   └── site-creator.js           # Site creation and management component
├── pages/
│   ├── index.html                # Main entry point
│   ├── dashboard.html            # Dashboard page content
│   └── admin.html                # Admin panel content
├── styles/
│   ├── main.css                  # Main stylesheet
│   └── components.css            # Component-specific styles
└── README.md                     # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Modern web browser with ES6+ support
- Local web server (for development)
- DigitalOcean Spaces account (for production)

### Installation

1. **Clone or download** the frontend-ajax directory to your web server

2. **Configure DigitalOcean Spaces**:
   - Update `config/spaces-config.js` with your bucket details
   - Set up CORS configuration for your domain
   - Configure your bucket permissions

3. **Start a local server** (for development):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve frontend-ajax
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Open your browser** and navigate to `http://localhost:8000`

### Configuration

Edit `config/spaces-config.js` to match your setup:

```javascript
const SpacesConfig = {
    bucket: "your-bucket-name",
    region: "nyc3",
    directory: "/myaispace/subdomains/",
    basePath: "",
    debugMode: true,
    demoMode: false,
    // ... other settings
};
```

## 🏗️ Architecture Overview

### Core Components

#### Navigation Manager (`core/navigation-manager.js`)
- Handles AJAX content loading
- Manages History.js integration
- Provides smooth page transitions
- Handles dynamic content binding

#### State Manager (`core/state-manager.js`)
- Manages localStorage operations
- Handles state persistence
- Provides session management
- Manages configuration storage

#### Error Handler (`core/error-handler.js`)
- Provides user-friendly error messages
- Handles CORS and network errors
- Manages error logging
- Shows error notifications

### Utility Components

#### URL Utils (`utils/url-utils.js`)
- Path manipulation and validation
- Subdomain handling
- URL construction helpers
- Breadcrumb generation

#### Cache Manager (`utils/cache-manager.js`)
- Content caching system
- Storage quota management
- Cache invalidation
- Performance monitoring

### Component System

#### Site Creator (`components/site-creator.js`)
- Site creation workflow
- Template selection
- Form validation
- File upload handling

## 📱 Usage Guide

### Basic Navigation

The application uses AJAX navigation with the following features:

- **Internal Links**: Use `class="nav-link"` for AJAX navigation
- **External Links**: Regular `<a>` tags open normally
- **Programmatic Navigation**: Use `NavigationManager.navigateTo(path)`

### Creating a New Site

1. Navigate to the Admin panel
2. Click "Add Site" button
3. Fill in the site details:
   - Site name
   - Subdomain (automatically validated)
   - Description
   - Template selection
4. Upload files (optional)
5. Configure advanced options
6. Click "Create Site"

### Managing Content

#### File Structure
Each subdomain follows this structure in DigitalOcean Spaces:
```
your-bucket/
├── subdomain1/
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   └── assets/
│       ├── images/
│       └── css/
└── subdomain2/
    ├── index.html
    └── ...
```

#### Content Guidelines
- HTML files should contain only the content for the `#content` div
- Use `class="nav-link"` for internal navigation
- Include proper meta tags in your main index.html
- Optimize images and assets for performance

### State Management

The application automatically manages state for:
- Current page content
- Scroll position
- Form data
- User preferences
- Cache data

### Error Handling

The system provides comprehensive error handling:
- Network errors with retry options
- CORS configuration guidance
- User-friendly error messages
- Debug information in development mode

## 🎨 Styling and Theming

### CSS Architecture

- **Main CSS** (`styles/main.css`): Base styles, layout, and utilities
- **Components CSS** (`styles/components.css`): AJAX-specific components
- **Responsive Design**: Mobile-first approach with breakpoints
- **CSS Variables**: Consistent theming and easy customization

### Customization

To customize the appearance:

1. **Colors**: Update CSS variables in `main.css`
2. **Layout**: Modify grid system and container classes
3. **Components**: Override component styles in `components.css`
4. **Themes**: Create theme-specific CSS files

## 🔧 Development

### Debug Mode

Enable debug mode in `spaces-config.js`:
```javascript
debugMode: true
```

This provides:
- Console logging
- Debug panel
- Performance metrics
- Error details

### Adding New Components

1. Create component file in `components/` directory
2. Add component-specific CSS to `styles/components.css`
3. Initialize component in main application
4. Document component usage

### Testing

The application includes built-in testing capabilities:
- Error simulation
- Performance monitoring
- State validation
- Cache testing

## 📊 Performance Optimization

### Caching Strategy

- **Browser Cache**: Leverages standard HTTP caching
- **localStorage**: Caches content locally
- **CDN**: Uses Cloudflare for static assets
- **Lazy Loading**: Images and heavy content

### Best Practices

1. **Optimize Images**: Use appropriate formats and sizes
2. **Minimize CSS/JS**: Keep inline styles minimal
3. **Use CDN**: Serve external resources from CDN
4. **Enable Compression**: Use gzip/brotli compression
5. **Monitor Performance**: Use built-in performance metrics

## 🔒 Security Considerations

### CORS Configuration

Configure CORS for your DigitalOcean Spaces bucket:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

### Content Security

- Validate all user inputs
- Sanitize HTML content
- Use HTTPS in production
- Implement proper access controls

## 🚀 Deployment

### Production Setup

1. **Configure Production Settings**:
   - Set `debugMode: false`
   - Update CORS origins
   - Configure SSL certificates
   - Set up monitoring

2. **Upload to Web Server**:
   - Upload all files to your web server
   - Ensure proper file permissions
   - Configure server caching

3. **Configure Domain**:
   - Set up DNS records
   - Configure SSL certificates
   - Set up CDN (optional)

### Environment Variables

For production, consider using environment variables for:
- API endpoints
- Bucket credentials
- Debug settings
- Feature flags

## 📚 API Reference

### Navigation Manager

```javascript
// Navigate to a page
NavigationManager.navigateTo('/about');

// Get current path
const path = NavigationManager.getCurrentPath();

// Set subdomain
NavigationManager.setSubdomain('example');
```

### State Manager

```javascript
// Save state
StateManager.saveState(subdomain, path, data);

// Load state
const state = StateManager.loadState(subdomain, path);

// Save configuration
StateManager.saveConfig(config);
```

### Cache Manager

```javascript
// Cache content
CacheManager.set(key, content);

// Get cached content
const content = CacheManager.get(key);

// Get cache statistics
const stats = CacheManager.getStats();
```

### Error Handler

```javascript
// Show error message
ErrorHandler.showError('Error message', 'error');

// Handle specific error
ErrorHandler.handleCorsError(url);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the AJAX site format guide
- Open an issue on GitHub
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- AJAX navigation system
- State management
- Admin panel
- Site creation workflow
- Responsive design
- Error handling
- Caching system

---

**Built with ❤️ for modern web development** 