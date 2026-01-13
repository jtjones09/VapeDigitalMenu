# Design Guidelines - Digital Menu Platform

## Design Approach

**Reference-Based Hybrid:**
- **Admin Portal**: Linear + Shopify Admin aesthetic (clean, efficient, data-forward)
- **Customer Menu**: Airbnb + Instagram patterns (visual browsing, card-based)
- **Kiosk Mode**: Specialized retail kiosk design (large targets, clear hierarchy)

**Core Principle**: Dual-personality design - professional efficiency for shop owners, approachable simplicity for customers.

---

## Typography

**Font Families:**
- Primary: Inter (Google Fonts) - all UI, headings, body text
- Monospace: JetBrains Mono - OTP codes, technical data

**Type Scale:**
- Display: text-5xl/font-bold (admin headlines)
- H1: text-3xl/font-semibold (section headers)
- H2: text-2xl/font-semibold (subsections)
- H3: text-xl/font-medium (card headers)
- Body: text-base/font-normal (default text)
- Small: text-sm (metadata, labels)
- Tiny: text-xs (timestamps, helper text)

**Kiosk Mode Scaling**: Increase all text sizes by 1.25x for tablet readability.

---

## Layout System

**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-8
- Section spacing: gap-6 to gap-12
- Page margins: px-6 (mobile), px-12 (desktop)
- Card spacing: p-6 standard

**Grid System:**
- Admin: 12-column responsive grid (max-w-7xl container)
- Customer Menu: Single column mobile, 2-3 column desktop (product cards)
- Kiosk: Fixed 1024px width, 3-4 column product grid

**Breakpoints:**
- Mobile: 375px+ (single column)
- Tablet: 768px+ (2 columns)
- Desktop: 1024px+ (3-4 columns)
- Kiosk: 1024x768 landscape optimized

---

## Component Library

### Admin Portal Components

**Navigation Sidebar:**
- Fixed left rail (240px wide)
- Logo at top (h-16)
- Menu items with icons (h-12 each)
- Active state: background emphasis
- Bottom section: user profile, settings

**Product Catalog:**
- Search bar: full-width, h-12, prominent placement
- Filters: horizontal chip-style toggles
- Product cards: 300px width, image 1:1, stacked info
- "Add to Menu" button: primary CTA

**My Menu Manager:**
- Drag handles: visible grip icons on left
- Reorder zones: subtle background on hover
- Toggle switches: active/inactive status
- Delete confirmation: modal overlay

**OTP Input:**
- 6 boxes: w-12 h-14, 2px borders
- Auto-focus animation
- Error state: red border shake
- Large digits: text-3xl centered

### Customer Menu Components

**Product Card (Standard):**
- Square image: aspect-square
- Brand badge: top-left overlay, semi-transparent
- Heart icon: top-right corner, 44px tap target
- Title: text-lg/font-semibold, 2-line clamp
- Flavor category: chip badge
- Tap entire card for details

**Product Detail View:**
- Hero image: 2:3 aspect ratio, full-width
- Sticky header: back button, favorite icon
- Content sections: specs, variants, description
- Variant selector: radio button grid
- Bottom bar: "Show to Staff" CTA

**Kiosk-Specific Elements:**
- Login buttons: h-20, text-xl, icon + label
- Auto-logout timer: fixed bottom, progress bar
- Staff Reset: 60px circle, bottom-right, lock icon
- Guest mode badge: persistent header indicator

### Shared Components

**Modal System:**
- Overlay: 50% opacity dark backdrop
- Container: max-w-md, rounded corners, centered
- Header: text-2xl, close button
- Actions: bottom-aligned, primary + secondary buttons

**Forms:**
- Input fields: h-12, rounded borders
- Labels: text-sm, 4px above input
- Error messages: text-sm, red, below field
- Success states: green border, checkmark icon

**Buttons:**
- Primary: h-12, bold text, full corners
- Secondary: outlined, same dimensions
- Ghost: text-only, hover background
- Icon buttons: 44px minimum, centered icon

**QR Code Display:**
- Center-aligned, 300px square
- Border frame with shop name
- Download buttons below
- Print-ready formatting

---

## Images

**Product Images:**
- Square ratio (1:1) for catalog cards
- 800x800px minimum resolution
- Consistent white/neutral backgrounds
- High-quality, professional photography

**Shop Logos:**
- Flexible dimensions, max 200px height
- SVG preferred, PNG fallback
- Transparent backgrounds
- Display in header (admin) and menu top (customer)

**Hero Sections:**
- **Admin Login/Onboarding**: No hero image - focus on form clarity
- **Customer Menu Landing**: Shop logo + name, minimal header (not a full hero)
- **Admin Setup Page**: Instructional graphics/diagrams (tablet mockups, QR placement examples)

**Icon Set:** Heroicons (outline style)

---

## Kiosk Mode Specifications

**Visual Indicators:**
- "KIOSK MODE" badge: persistent header, high contrast
- Inactivity timer: bottom bar, countdown + progress
- Fullscreen cues: hidden browser chrome reference

**Touch Optimization:**
- All targets: minimum 48px height
- Spacing: 12px between interactive elements
- Hover states: immediate visual feedback
- No double-tap required

**Session Management:**
- Visual countdown: circular progress or linear bar
- Warning at 1 minute: pulsing animation
- Auto-logout: fade transition to login screen

---

## Accessibility

- Minimum contrast: WCAG AA (4.5:1 text, 3:1 UI)
- Focus indicators: 2px offset outline
- Keyboard navigation: full support, visible focus
- Screen reader labels: all interactive elements
- Age verification: clear error messaging for under-18

---

## Responsive Behavior

**Mobile (375-767px):**
- Single column layouts
- Bottom navigation for customer menu
- Collapsible filters
- Full-width cards

**Tablet (768-1023px):**
- 2-column product grids
- Sidebar navigation (admin)
- Expanded filter panels

**Desktop (1024px+):**
- 3-4 column grids
- Persistent sidebars
- Multi-panel layouts

**Kiosk (1024x768 landscape):**
- Fixed layout, no responsive shifting
- Optimized for arm's length viewing
- Large type, generous spacing