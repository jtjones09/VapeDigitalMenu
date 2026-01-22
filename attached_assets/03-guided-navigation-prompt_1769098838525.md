# GUIDED NAVIGATION IMPLEMENTATION - REPLIT AGENT PROMPT

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Delete or truncate any existing code
- ❌ Break existing search functionality
- ❌ Remove any admin portal features
- ❌ Modify authentication flows
- ❌ Change customer table or age verification

**DO:**
- ✅ ADD nicotineType field to products table
- ✅ CREATE category-based navigation flow
- ✅ MAINTAIN persistent search bar (always visible)
- ✅ UPDATE seed data to include nicotine types
- ✅ KEEP all existing features working

---

## 📋 YOUR TASK

**Current State:** Menu has global search with filters (product type, flavor category)

**Goal:** Add guided two-tier navigation while keeping search available

**New User Flow:**
1. Landing screen → Choose nicotine type (Regular vs Salt)
2. Flavor category → Choose flavor (Fruit, Dessert, etc.)
3. Product list → Filtered results
4. Search bar → Always visible at every step

---

## 🗄️ PART 1: UPDATE DATABASE SCHEMA

**File:** `/shared/schema.ts`

**Find the products table** (around line 54-70)

**ADD this field to the products table:**

```typescript
nicotineType: varchar("nicotine_type", { length: 20 }),
// Values: "regular", "salt", "none"
// - regular: Traditional freebase nicotine (0-24mg e-liquids)
// - salt: Salt nicotine (10-50mg e-liquids)
// - none: Disposables, hardware (no nicotine classification)
```

**ADD this constant BEFORE the products table:**

```typescript
export const nicotineTypes = ["regular", "salt", "none"] as const;
export type NicotineType = typeof nicotineTypes[number];
```

**Run database migration:**
```bash
npm run db:push
```

---

## 🌱 PART 2: UPDATE SEED DATA

**File:** `/server/seed.ts`

**Current state:** ~47 e-liquid products with no nicotine type

**Required changes:**

### Step 1: Split each e-liquid into TWO products

For EVERY e-liquid in the seed data, create TWO versions:

**Example - Current:**
```javascript
{
  productName: "Tropical Paradise",
  productType: "e-liquid",
  flavorCategory: "fruit",
  flavorDescription: "A refreshing blend of mango, pineapple, and coconut"
}
```

**Example - NEW (Create both):**
```javascript
{
  productName: "Tropical Paradise",
  productType: "e-liquid",
  flavorCategory: "fruit",
  nicotineType: "regular", // ADD THIS
  flavorDescription: "A refreshing blend of mango, pineapple, and coconut. Available in 0mg, 3mg, 6mg, 12mg, 18mg"
},
{
  productName: "Tropical Paradise",
  productType: "e-liquid",
  flavorCategory: "fruit",
  nicotineType: "salt", // ADD THIS
  flavorDescription: "A refreshing blend of mango, pineapple, and coconut. Available in 20mg, 35mg, 50mg salt nicotine for a smoother hit"
}
```

### Step 2: Set nicotineType for ALL products

**For e-liquids:** Create both regular AND salt versions (doubles the count)
**For disposables:** Set `nicotineType: "none"` (or "salt" if they contain salt nic)
**For hardware:** Set `nicotineType: "none"`

### Step 3: Verify counts after seeding

After updating seed data, you should have:
- ~94 e-liquids (47 original × 2 for regular/salt)
- 50 disposables with `nicotineType: "none"`
- 30 hardware with `nicotineType: "none"`
- **Total: ~174 products** (close to 200 target)

---

## 🎨 PART 3: CREATE CATEGORY SELECTOR COMPONENT

**Create file:** `/client/src/components/menu/category-selector.tsx`

**Purpose:** Landing screen with two big buttons (Regular vs Salt Nicotine)

**Requirements:**

### Visual Design:
- Two large buttons side-by-side (desktop) or stacked (mobile)
- Each button: 300px × 200px minimum (kiosk mode)
- Clear icons/colors to distinguish:
  - Regular Nicotine: Blue color scheme
  - Salt Nicotine: Red/purple color scheme
- Include description text under each button
- "Coming Soon" section for Disposables/Hardware (grayed out)

### Button Content:
```
🔵 Regular Nicotine E-Liquids
   Traditional nicotine (0-24mg)
   Great for cloud chasing

🔴 Salt Nicotine E-Liquids
   Smooth high-strength (10-50mg)
   Fast nicotine satisfaction
```

### Behavior:
- Clicking Regular → Navigate to `/menu/:shopId/regular`
- Clicking Salt → Navigate to `/menu/:shopId/salt`
- Show search bar in header (always visible)
- Optional: "Browse All Products" link at bottom

---

## 🍓 PART 4: CREATE FLAVOR CATEGORY GRID

**Create file:** `/client/src/components/menu/flavor-category-grid.tsx`

**Purpose:** Grid of flavor categories after choosing nicotine type

**Requirements:**

### Categories to Display:
```
🍓 Fruit
🍰 Dessert
🍬 Candy
❄️  Menthol
🚬 Tobacco
☕ Beverage
🌐 All Flavors (shows all under this nicotine type)
```

### Visual Design:
- Grid layout: 3 columns (desktop), 2 columns (mobile)
- Each card: Icon + label
- Large tap targets (100px × 100px minimum for kiosk)
- Hover effects

### Behavior:
- Clicking Fruit → Navigate to `/menu/:shopId/regular/fruit`
- Back button → Returns to category selector
- Breadcrumb: "Regular Nicotine > Choose Flavor"

---

## 🔍 PART 5: UPDATE PRODUCT LIST WITH FILTERING

**Update file:** `/client/src/pages/menu/index.tsx`

**Current:** Shows all products with basic filters

**Update to:**

### Routing Logic:
```typescript
// Detect URL parameters
const params = useParams<{ shopId: string; nicotineType?: string; flavorCategory?: string }>();

// Examples:
// /menu/abc123 → Landing (category selector)
// /menu/abc123/regular → Flavor grid (regular nic)
// /menu/abc123/regular/fruit → Product list (regular fruit e-liquids)
// /menu/abc123/salt/dessert → Product list (salt dessert e-liquids)
```

### Filter Products Based on URL:
```typescript
// If nicotineType in URL, filter by it
// If flavorCategory in URL, filter by it
// Otherwise, show category selector
```

### Breadcrumb Navigation:
```
Landing: [No breadcrumb]
Flavor Grid: "Regular Nicotine"
Product List: "Regular Nicotine > Fruit"
```

### Back Button:
- Product list → Flavor grid
- Flavor grid → Landing
- Always available, top-left

---

## 🔎 PART 6: IMPLEMENT PERSISTENT SEARCH BAR

**Create file:** `/client/src/components/menu/search-bar.tsx`

**Purpose:** Search bar that's ALWAYS visible, doesn't conflict with categories

**Requirements:**

### Position:
- **Desktop/Kiosk:** Fixed header, full-width or centered
- **Mobile:** Sticky header OR bottom nav icon that opens full-screen search

### Behavior:
```typescript
// Scoped search (default)
// If on /menu/abc123/regular/fruit, search only regular fruit products
// Show toggle: "Search all products" to remove filters

// Autocomplete
// Show top 5 results as user types
// Display: product image, name, nicotine type badge

// Recent searches
// When search bar is focused (before typing), show last 3-5 searches
// Store in localStorage per user
```

### Visual Design:
- Placeholder: "Search for flavors, brands, or products..."
- Magnifying glass icon on left
- Clear (X) button when typing
- Dropdown suggestions with product images
- Highlight matching text in suggestions

### Search Scope Indicator:
```
Currently searching: Regular Nicotine > Fruit
[Search all products instead]
```

---

## 🧭 PART 7: CREATE BREADCRUMB COMPONENT

**Create file:** `/client/src/components/menu/breadcrumbs.tsx`

**Purpose:** Show current navigation path with clickable back links

**Requirements:**

### Display Format:
```
[←] Regular Nicotine > Fruit
    ↑                  ↑
  Back to landing   Current page
```

### Behavior:
- Each segment is clickable
- Clicking "Regular Nicotine" → Goes to flavor grid
- Back arrow → Goes up one level
- Only show when not on landing page

### Styling:
- Muted text for path
- Bold for current page
- Separator: ">" or "/"

---

## 📱 PART 8: RESPONSIVE DESIGN SPECS

### Kiosk Mode (Tablet - 1024×768):
**Category Selector:**
- Buttons: 300px × 200px each
- Font: 24px body, 36px headings
- Grid: 2 columns (Regular | Salt)
- Spacing: 32px between elements

**Flavor Grid:**
- Cards: 150px × 150px
- 3 columns
- Large icons (64px)
- Font: 20px labels

**Product List:**
- Cards: 280px wide minimum
- 2-3 columns depending on screen
- Same as current implementation but filtered

### Personal Mode (Mobile - 375px):
**Category Selector:**
- Buttons: Full width, stacked
- 250px height each
- Font: 16px body, 24px headings

**Flavor Grid:**
- Cards: 2 columns
- 120px × 120px
- Icons: 48px
- Font: 16px labels

**Product List:**
- Single column
- Cards: Full width
- Same as current mobile view

### Both Modes:
- Search bar always visible (sticky)
- Back button always available
- Smooth transitions between screens
- Loading states for each screen

---

## 🎯 PART 9: UPDATE ROUTING

**Update file:** `/client/src/App.tsx`

**Add these routes:**

```typescript
<Route path="/menu/:shopId" component={Menu} />
<Route path="/menu/:shopId/:nicotineType" component={Menu} />
<Route path="/menu/:shopId/:nicotineType/:flavorCategory" component={Menu} />
<Route path="/menu/:shopId/product/:productId" component={ProductDetail} />
```

**In Menu component, detect which view to show:**
```typescript
// If no nicotineType in URL → Show CategorySelector
// If nicotineType but no flavorCategory → Show FlavorCategoryGrid
// If both nicotineType and flavorCategory → Show ProductList (filtered)
```

---

## 🔄 PART 10: AUTHENTICATION HANDLING

**IMPORTANT:** This guided flow works for ALL users:

✅ **Authenticated customers** (logged in)
- Can browse categories
- Can favorite products
- Can use search

✅ **Unauthenticated guests** (not logged in)
- Can browse categories
- Cannot favorite (button disabled)
- Can use search

✅ **Kiosk mode users**
- Same guided flow
- Larger UI elements
- Same functionality

**NO changes to authentication required** - just UI/routing changes

---

## ✅ PART 11: TESTING CHECKLIST

### Category Navigation:
- [ ] Landing page shows Regular + Salt buttons
- [ ] Clicking Regular → Flavor grid for regular nicotine
- [ ] Clicking Salt → Flavor grid for salt nicotine
- [ ] Flavor grid shows all 7 categories (Fruit, Dessert, etc.)
- [ ] Clicking Fruit → Product list shows only fruit e-liquids
- [ ] Products are correctly filtered by nicotineType + flavorCategory
- [ ] Back button works at every level

### Search Functionality:
- [ ] Search bar visible on landing page
- [ ] Search bar visible on flavor grid
- [ ] Search bar visible on product list
- [ ] Search bar visible on product detail
- [ ] Autocomplete shows suggestions as you type
- [ ] Recent searches appear when focused
- [ ] Scoped search works (searches within current filters)
- [ ] "Search all products" removes filters
- [ ] Search results are accurate

### Breadcrumbs:
- [ ] No breadcrumb on landing
- [ ] "Regular Nicotine" on flavor grid
- [ ] "Regular Nicotine > Fruit" on product list
- [ ] Breadcrumb segments are clickable
- [ ] Clicking breadcrumb navigates correctly

### Database:
- [ ] All e-liquids have nicotineType set
- [ ] Both regular AND salt versions exist for each flavor
- [ ] Disposables have nicotineType: "none" (or "salt")
- [ ] Hardware has nicotineType: "none"
- [ ] Total product count: ~170-200

### Responsive Design:
- [ ] Kiosk mode: Large buttons, easy to tap
- [ ] Mobile: Stacked layout, full-width buttons
- [ ] Desktop: Grid layout, optimal spacing
- [ ] All modes: Search always visible

---

## 🚨 PART 12: EDGE CASES TO HANDLE

**Case 1: No products in category**
- Show message: "No products found in this category"
- Suggest: "Try a different flavor or search for something specific"

**Case 2: Invalid URL parameters**
- `/menu/abc123/invalid` → Redirect to landing
- `/menu/abc123/regular/invalid` → Redirect to flavor grid

**Case 3: Search with no results**
- Show: "No results found for '[query]'"
- Suggest: Recent searches or popular products
- Don't break the page

**Case 4: Back button on landing**
- Don't show back button
- Or make it go to shop's homepage/kiosk welcome

---

## 📊 PART 13: EXPECTED OUTCOME

**Before:**
```
/menu/abc123
├── Global search
├── Filter dropdowns (type, category)
└── All products in one list
```

**After:**
```
/menu/abc123
├── Category Selector (Regular vs Salt)
│   └── Search bar (always visible)
│
/menu/abc123/regular
├── Flavor Grid (Fruit, Dessert, etc.)
│   ├── Search bar (scoped to regular nic)
│   └── Back to categories
│
/menu/abc123/regular/fruit
├── Product List (filtered: regular + fruit)
│   ├── Search bar (scoped to regular fruit)
│   ├── Breadcrumbs: "Regular Nicotine > Fruit"
│   └── Back to flavor grid
```

**Search is available at EVERY level** - doesn't conflict with navigation

---

## 🎨 PART 14: UI/UX POLISH

### Category Selector Cards:
- Hover effect (scale 1.05)
- Drop shadow on hover
- Icon + Title + Subtitle
- Clear visual distinction between Regular (blue) and Salt (red)

### Flavor Category Cards:
- Large emoji icons for visual recognition
- Consistent card sizes
- Hover state
- Product count badge: "Fruit (24 products)"

### Product Cards:
- Add nicotine type badge:
  - "Regular" badge (blue)
  - "Salt" badge (red/purple)
- Show available nicotine levels in description
- Keep existing favorite button, image, etc.

### Animations:
- Smooth transitions between screens (fade in/out)
- Loading skeleton for product list
- Search dropdown slide-in effect

---

## 🔮 PART 15: FUTURE ENHANCEMENTS (DOCUMENT, DON'T BUILD)

**Coming Soon - Disposables:**
```typescript
// When ready, add to CategorySelector:
{
  title: "Disposable Vapes",
  icon: "💨",
  nicotineType: "none",
  route: "/menu/:shopId/disposables"
}
```

**Coming Soon - Hardware:**
```typescript
// When ready, add to CategorySelector:
{
  title: "Hardware & Accessories",
  icon: "🔧",
  nicotineType: "none",
  route: "/menu/:shopId/hardware"
}
```

**Add feature flags in shop settings:**
```typescript
interface ShopFeatures {
  showDisposables: boolean; // Default: false
  showHardware: boolean;    // Default: false
}
```

**When enabled:**
- Show category on landing page
- Add routing for those categories
- No code changes needed (architecture supports it)

---

## ⏸️ STOP AND VERIFY

**Before moving forward, confirm:**

✅ **Database:**
- [ ] nicotineType field added to products table
- [ ] Migration ran successfully (npm run db:push)
- [ ] All products have nicotineType set

✅ **Seed Data:**
- [ ] E-liquids split into regular + salt versions
- [ ] Product count ~170-200
- [ ] Both versions have appropriate descriptions

✅ **Navigation:**
- [ ] CategorySelector component created
- [ ] FlavorCategoryGrid component created
- [ ] Routing updated for new URL structure
- [ ] Back navigation works

✅ **Search:**
- [ ] SearchBar component created
- [ ] Always visible at every level
- [ ] Autocomplete working
- [ ] Scoped and global search both work

✅ **UI:**
- [ ] Responsive (kiosk large, mobile small)
- [ ] Breadcrumbs working
- [ ] Nicotine type badges on product cards

✅ **Testing:**
- [ ] Can navigate: Landing → Flavor → Products
- [ ] Can search at any level
- [ ] Back button works
- [ ] No broken links or errors

---

## 🎯 SUCCESS CRITERIA

**User Flow Test:**
1. Visit `/menu/abc123` → See category selector (Regular vs Salt)
2. Click "Regular Nicotine" → See flavor grid
3. Click "Fruit" → See filtered product list (regular fruit only)
4. Search still works → Can find any product
5. Click back → Return to flavor grid
6. Search for "strawberry" → Find both regular AND salt versions

**Database Test:**
```sql
-- Check nicotineType distribution
SELECT nicotine_type, COUNT(*) as count 
FROM products 
GROUP BY nicotine_type;

-- Expected:
-- regular: ~94
-- salt: ~94
-- none: ~30-50
```

**Performance:**
- Landing loads < 2 seconds
- Flavor grid loads < 1 second
- Product list loads < 2 seconds
- Search autocomplete < 500ms

---

Good luck! Remember: DO NOT truncate any code. Build incrementally and test at each step. 🚀
