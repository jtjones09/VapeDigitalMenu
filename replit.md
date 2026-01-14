# MenuBoard - Digital Menu Platform

## Overview

MenuBoard is a digital menu platform that allows shop owners to create beautiful digital menus for their stores. Customers can browse products on their phones via QR code or on in-store tablets/kiosks. The platform has a dual-personality design: a professional admin portal for shop owners and an approachable customer-facing menu interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Fonts**: Inter for UI text, JetBrains Mono for monospace elements

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API endpoints under `/api/*` prefix
- **Authentication**: Supabase OTP (email verification codes)
- **Session Management**: Supabase JWT tokens validated via service role key

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Migrations**: Managed via drizzle-kit with migrations output to `./migrations`

### Key Data Models
- **Users/Sessions**: Authentication tables required for Replit Auth
- **Shops**: Store information linked to authenticated users
- **Brands**: Product brand catalog
- **Products/ProductVariants**: Global product catalog with variants
- **ShopProducts**: Junction table linking products to specific shops
- **CustomerFavorites**: Customer product favorites per shop

### Authentication Flow
- Supabase handles user authentication via OTP (email codes)
- New users: Sign up page collects email, owner name, shop name, location → sends OTP → verify → creates shop
- Returning users: Login page collects email → sends OTP → verify → redirects to dashboard
- JWT tokens sent in Authorization header for all API requests
- Protected routes use `isAuthenticated` middleware (validates JWT via Supabase)

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Vite builds to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Server dependencies are selectively bundled to reduce cold start times

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  replit_integrations/auth/  # Replit Auth implementation
shared/           # Shared code between client and server
  schema.ts       # Drizzle database schema
  models/         # Shared type definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- Uses Drizzle ORM for type-safe queries and migrations

### Authentication
- **Supabase**: Email OTP authentication
- Requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend)
- Requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend)

### UI Libraries
- **Radix UI**: Headless component primitives
- **shadcn/ui**: Pre-built component library (new-york style)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **React Day Picker**: Calendar component
- **Recharts**: Charting library
- **Vaul**: Drawer component

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **ESBuild**: Server bundling for production
- **drizzle-kit**: Database migration tooling

## Recent Changes

### January 2026
- Added age verification system for customers (18+ requirement)
  - New `customers` table for storing customer profiles and age verification status
  - Age verification modal collects first name, last name, and date of birth
  - Server-side validation ensures users are 18+ before granting access
  - Shop owners are excluded from age verification (they can browse menus freely)
  - Kiosk mode users are not prompted for age verification
- Fixed menu query key construction to properly build URL with query parameters
- Fixed seed script to insert msrp values as numbers instead of strings
- Added demo shop with ID "demo" for testing and demonstration
- Expanded product catalog: 25 real vape brands, 200 products, 5,360 variants
- Migrated authentication from Replit Auth to Supabase OTP (email verification codes)
- Fixed logout redirect to properly navigate to landing page

## Key Features

### Admin Portal (/admin/*)
- Dashboard with shop overview
- Products Catalog with search and filters
- My Menu page for drag-and-drop menu customization
- Setup page with QR code generation for customers
- Settings page for shop configuration and kiosk timeout

### Customer Menu (/menu/:shopId)
- Product grid with search and category filters
- Product detail pages with variant information
- Customer favorites (when logged in)
- Kiosk mode (?mode=kiosk) with:
  - Auto-logout timer (configurable, default 5 minutes)
  - Staff reset button for session clearing
  - Larger touch-friendly UI elements

### Demo Shop
- Shop ID: "demo"
- 200 products across 25 real vape brands (115 e-liquids, 50 disposables, 35 hardware/accessories)
- 5,360 product variants with realistic pricing and options
- Test URLs:
  - Customer menu: /menu/demo
  - Kiosk mode: /menu/demo?mode=kiosk