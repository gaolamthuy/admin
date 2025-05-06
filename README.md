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

## License

[Your License Here]
