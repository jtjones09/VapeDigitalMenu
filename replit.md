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
- **ShopOwners/Sessions**: Shop owner authentication tables (renamed from `users` for clarity)
- **Shops**: Store information linked to shop owners via `shopOwnerId`
- **Customers**: Customer accounts for menu browsing (separate from shop owners)
- **Brands**: Product brand catalog
- **Products/ProductVariants**: Global product catalog with variants
- **ShopProducts**: Junction table linking products to specific shops
- **CustomerFavorites**: Customer product favorites per shop
- **KioskSessions**: Guest/kiosk session tracking with auto-expiry

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
- **Added multi-shop support** for shop owners
  - New `GET /api/shops/list` endpoint returns all shops for an owner
  - New `POST /api/shops/create` endpoint for creating additional shops
  - ShopProvider context tracks currently selected shop across admin pages
  - ShopSelector dropdown in admin header for switching between shops
  - "Create New Shop" page at `/admin/create-shop`
  - Selected shop persisted to localStorage for session continuity
  - All admin pages updated to use `useShop()` hook from context
- **Renamed `users` table to `shop_owners`** for clarity
  - Database: `users` → `shop_owners` table
  - Database: `shops.user_id` → `shops.shop_owner_id` column
  - Code: All references updated (`getShopByOwnerId`, `shopOwners`, `ShopOwner` type)
  - Clear separation: `shop_owners` for admins, `customers` for menu users
- Added kiosk mode admin access feature for shop owners
  - Discreet "Admin" link in guest login screen
  - Two-step email OTP verification against shop owner
  - Verifies email owns specific shop via INNER JOIN
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
- Multi-shop support: Shop selector in header, create new shops at /admin/create-shop

### Customer Menu Routing
Two parallel route sets for personal and kiosk modes:

**Personal Mode** (`/menu/:shopId/...`):
- `/menu/:shopId` - Category selector (nicotine type)
- `/menu/:shopId/:nicotineType` - Flavor category grid
- `/menu/:shopId/:nicotineType/:flavorCategory` - Product listing
- `/menu/:shopId/product/:productId` - Product detail

**Kiosk Mode** (`/menu/kiosk/:shopId/...`):
- Same route structure with `/menu/kiosk/` prefix
- Detected via `currentPath.startsWith('/menu/kiosk/')`

**Important Routing Note**: The Menu component parses route parameters directly from `useLocation()` instead of using wouter's `useParams()`. This is because `useParams()` is NOT reactive when navigating between routes that share the same component - it returns stale values. By parsing from `useLocation()`, the component correctly updates when the URL changes.
- All components use `buildUrl()` helper to preserve kiosk prefix during navigation

**Route Order (Critical)**: Kiosk routes MUST be declared before personal routes in App.tsx because wouter matches the first matching pattern.

### Customer Menu Features
- Two-tier navigation: Nicotine type → Flavor category → Products
- Product grid with search and category filters
- Product detail pages with variant information
- Customer favorites (when logged in)
- Kiosk mode features:
  - Auto-logout timer (configurable, default 5 minutes)
  - Staff reset button for session clearing
  - Larger touch-friendly UI elements

### Demo Shop
- Shop ID: "demo"
- 200 products across 25 real vape brands (115 e-liquids, 50 disposables, 35 hardware/accessories)
- 5,360 product variants with realistic pricing and options
- Test URLs:
  - Customer menu: /menu/demo
  - Kiosk mode: /menu/kiosk/demo