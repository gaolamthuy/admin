# Gao Lam Thuy POS Web App

This is a web-based version of the Gao Lam Thuy POS (Point of Sale) system, converted from an Electron desktop application to a React web application.

## Key Features

- Modern React-based POS system
- Product management and inventory tracking
- Order processing and checkout
- Customer management
- Invoicing and receipt generation
- Server-based printing support

## Server-Based Printing

This application uses a centralized print server for all printing tasks:

1. When you click a print button, a request is sent to the print server.
2. The server processes the request and sends it to the appropriate printer.
3. No browser print dialog appears - printing happens directly on the server.
4. The printer settings in the app are used for reference only.

### Print API Configuration

The following environment variables can be used to configure the API:

#### API Endpoints

The application uses the following endpoints:

- `/print/jobs` - For all printing operations
- `/pos/new-glt-invoice` - For creating new invoices

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Build for production
npm run build
```

### Development

This application is built with:

- React 18
- TypeScript
- Ant Design for UI components
- React Router for navigation
- Supabase for backend services

## Browser Compatibility

This web application is compatible with modern web browsers:

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Environment Setup

This project uses environment variables to manage configuration for different environments. Follow these steps to set up your environment:

### Required Environment Variables

The following environment variables are required for the application to function correctly:

- `REACT_APP_SUPABASE_URL`: URL of your Supabase instance
- `REACT_APP_SUPABASE_SERVICE_KEY`: Service key for accessing Supabase
- `REACT_APP_BACKEND_URL`: URL of the backend API
- `REACT_APP_API_USERNAME`: Username for API authentication
- `REACT_APP_API_PASSWORD`: Password for API authentication

### Environment Files

The project uses different environment files for different environments:

1. `.env`: Default environment file used in development
2. `.env.development`: Used when running in development mode
3. `.env.production`: Used when building for production

### Setting Up Your Environment

1. Copy the `.env.example` file to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder values with your actual credentials.

3. **IMPORTANT: Never commit your actual credentials to version control.** The `.env*` files are listed in `.gitignore` but always double-check before committing.

### Security Best Practices

- Keep your API keys and credentials secure
- Use different credentials for development and production environments
- Regularly rotate your API keys and passwords
- Monitor for unauthorized access to your services

## License

[Your License Here]
