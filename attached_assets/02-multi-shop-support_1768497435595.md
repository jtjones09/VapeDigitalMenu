# PROMPT #2: ADD MULTI-SHOP SUPPORT

## ⚠️ PREREQUISITES - READ FIRST

**STOP! Before starting this prompt:**

✅ **Has Prompt #1 been completed?**
- [ ] `users` table renamed to `shop_owners`
- [ ] `shops.userId` renamed to `shops.shopOwnerId`
- [ ] All code references updated
- [ ] Shop owner login tested and working
- [ ] Database migration successful

**If ANY of the above is incomplete, STOP and finish Prompt #1 first!**

---

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Break existing single-shop functionality
- ❌ Modify customer-facing menu pages
- ❌ Change kiosk mode behavior (each kiosk stays shop-specific)
- ❌ Delete any existing shops data
- ❌ Modify authentication flow

**DO:**
- ✅ ADD shop selector to admin dashboard
- ✅ ADD "Create New Shop" functionality
- ✅ ADD context/state to track "current shop"
- ✅ UPDATE all admin pages to use current shop
- ✅ MAINTAIN backward compatibility (single shop owners work as before)

---

## 📋 YOUR TASK

**Current State:** App assumes one shop per owner (grabs first shop found)

**Goal:** Support multiple shops per owner with:
1. Shop selector in admin dashboard
2. "Create New Shop" button
3. Context to track which shop is currently active
4. All admin pages respect the current shop

**User Flow:**
- Owner with 1 shop: Works exactly as before (no UI changes needed)
- Owner with 2+ shops: Sees shop selector, can switch between shops

---

## 🎯 PART 1: UNDERSTAND THE PROBLEM

**Current behavior in `/api/shops/my`:**

```typescript
// This only returns the FIRST shop
const shop = await db.query.shops.findFirst({
  where: eq(shops.shopOwnerId, ownerId),
});
```

**Problem:**
- If owner has 2 shops, only the first is accessible
- Second shop exists in database but is invisible in UI
- No way to switch between shops
- No way to create additional shops

**What we're building:**
- API to fetch ALL shops for an owner
- UI to select which shop to work with
- Context to remember selected shop
- "Create New Shop" flow

---

## 🔧 PART 2: UPDATE BACKEND API

**File:** `/server/routes/shops.ts`

### Add: Get ALL shops for owner

**NEW endpoint:**
```
GET /api/shops/list
Response: [{ id, shopName, address, logoUrl, ... }, ...]
```

**Implementation:**
```typescript
// Get all shops for the authenticated owner
router.get("/api/shops/list", async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get ALL shops for this owner
    const shops = await db
      .select()
      .from(shops)
      .where(eq(shops.shopOwnerId, ownerId))
      .orderBy(shops.createdAt);

    res.json(shops);
  } catch (error: any) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ message: error.message });
  }
});
```

### Update: Get shop by ID (any shop owner owns)

**NEW endpoint:**
```
GET /api/shops/:shopId
Response: { id, shopName, address, logoUrl, ... }
```

**Implementation:**
```typescript
// Get a specific shop (verify ownership)
router.get("/api/shops/:shopId", async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { shopId } = req.params;

    const shop = await db.query.shops.findFirst({
      where: and(
        eq(shops.id, shopId),
        eq(shops.shopOwnerId, ownerId)
      ),
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found or unauthorized" });
    }

    res.json(shop);
  } catch (error: any) {
    console.error("Error fetching shop:", error);
    res.status(500).json({ message: error.message });
  }
});
```

### Keep: `/api/shops/my` for backward compatibility

**Modify to return first shop OR last-used shop:**

```typescript
// Get "my" shop (first shop or last-selected)
// For backward compatibility - returns first shop if owner has only one
router.get("/api/shops/my", async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get all shops
    const allShops = await db
      .select()
      .from(shops)
      .where(eq(shops.shopOwnerId, ownerId));

    if (allShops.length === 0) {
      return res.status(404).json({ message: "No shop found" });
    }

    // If only one shop, return it
    if (allShops.length === 1) {
      return res.json(allShops[0]);
    }

    // If multiple shops, return the first (or implement "last selected" logic)
    // TODO: In future, track last-selected shop in user preferences
    return res.json(allShops[0]);
  } catch (error: any) {
    console.error("Error fetching my shop:", error);
    res.status(500).json({ message: error.message });
  }
});
```

---

## 🎨 PART 3: CREATE SHOP CONTEXT (FRONTEND)

**Create file:** `/client/src/contexts/shop-context.tsx`

**Purpose:** Track which shop is currently selected across all admin pages

**Implementation:**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Shop } from "@shared/schema";

interface ShopContextType {
  currentShop: Shop | null;
  allShops: Shop[];
  setCurrentShop: (shop: Shop) => void;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);

  // Fetch all shops for this owner
  const { data: allShops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops/list"],
  });

  // Set initial shop when shops load
  useEffect(() => {
    if (!currentShop && allShops.length > 0) {
      // Check localStorage for last-selected shop
      const savedShopId = localStorage.getItem("selectedShopId");
      
      if (savedShopId) {
        const savedShop = allShops.find(s => s.id === savedShopId);
        if (savedShop) {
          setCurrentShopState(savedShop);
          return;
        }
      }
      
      // Default to first shop
      setCurrentShopState(allShops[0]);
    }
  }, [allShops, currentShop]);

  const setCurrentShop = (shop: Shop) => {
    setCurrentShopState(shop);
    localStorage.setItem("selectedShopId", shop.id);
  };

  return (
    <ShopContext.Provider value={{ currentShop, allShops, setCurrentShop, isLoading }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}
```

**Wrap the admin routes with this provider in `/client/src/App.tsx`:**

```typescript
import { ShopProvider } from "@/contexts/shop-context";

function AdminRoutes() {
  // ... existing auth checks ...

  return (
    <ShopProvider>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        {/* ... other routes ... */}
      </Switch>
    </ShopProvider>
  );
}
```

---

## 🏪 PART 4: CREATE SHOP SELECTOR COMPONENT

**Create file:** `/client/src/components/shop-selector.tsx`

**Purpose:** Dropdown to switch between shops (shown in admin header)

**Features:**
- Shows current shop name
- Dropdown lists all shops
- "Create New Shop" button at bottom
- Only visible if owner has 2+ shops (or always visible with "Create" option)

**Implementation:**

```typescript
import { useShop } from "@/contexts/shop-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useLocation } from "wouter";

export function ShopSelector() {
  const { currentShop, allShops, setCurrentShop } = useShop();
  const [, setLocation] = useLocation();

  const handleCreateShop = () => {
    setLocation("/admin/create-shop");
  };

  if (!currentShop) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="w-4 h-4" />
          <span className="max-w-[150px] truncate">{currentShop.shopName}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your Shops</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {allShops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => setCurrentShop(shop)}
            className={currentShop.id === shop.id ? "bg-accent" : ""}
          >
            <Building2 className="w-4 h-4 mr-2" />
            <span className="truncate">{shop.shopName}</span>
            {currentShop.id === shop.id && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateShop}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Shop
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Add to admin layout header:**

**File:** `/client/src/components/admin-layout.tsx`

**In the header section, add:**

```typescript
import { ShopSelector } from "./shop-selector";

// In the header JSX:
<header className="border-b bg-background">
  <div className="flex items-center justify-between px-6 py-4">
    <h1>Admin Dashboard</h1>
    
    {/* Add shop selector */}
    <ShopSelector />
    
    {/* Existing user menu, etc */}
  </div>
</header>
```

---

## ➕ PART 5: CREATE "CREATE NEW SHOP" PAGE

**Create file:** `/client/src/pages/admin/create-shop.tsx`

**Purpose:** Form to add a new shop for the current owner

**Features:**
- Reuse onboarding form UI
- Auto-link to current shop owner
- Redirect to new shop after creation

**Implementation:**

```typescript
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Shop } from "@shared/schema";

export default function CreateShop() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const createShopMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest<Shop>({
        url: "/api/shops/create",
        method: "POST",
        body: data,
      });
    },
    onSuccess: (newShop) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops/list"] });
      toast({
        title: "Shop Created!",
        description: `${newShop.shopName} has been added successfully.`,
      });
      
      // Switch to new shop and redirect
      localStorage.setItem("selectedShopId", newShop.id);
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shop",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShopMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Shop</CardTitle>
            <CardDescription>
              Add another shop location to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleChange("shopName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createShopMutation.isPending}
                  className="flex-1"
                >
                  {createShopMutation.isPending ? "Creating..." : "Create Shop"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
```

**Add route in `/client/src/App.tsx`:**

```typescript
import CreateShop from "@/pages/admin/create-shop";

// In AdminRoutes:
<Route path="/admin/create-shop" component={CreateShop} />
```

---

## 🔄 PART 6: UPDATE ALL ADMIN PAGES TO USE CURRENT SHOP

**Every admin page that references "my shop" needs to use `useShop()` hook.**

### Example: Dashboard

**File:** `/client/src/pages/admin/dashboard.tsx`

**OLD:**
```typescript
const { data: shop } = useQuery<Shop>({
  queryKey: ["/api/shops/my"],
});
```

**NEW:**
```typescript
import { useShop } from "@/contexts/shop-context";

export default function Dashboard() {
  const { currentShop: shop, isLoading } = useShop();
  
  // Rest of component uses `shop` as before
}
```

### Pages to update:
- `/admin/dashboard.tsx` - Use current shop
- `/admin/products.tsx` - Filter products for current shop
- `/admin/my-menu.tsx` - Manage current shop's menu
- `/admin/setup.tsx` - Show QR/kiosk for current shop
- `/admin/settings.tsx` - Edit current shop's settings

**Pattern for all pages:**

```typescript
import { useShop } from "@/contexts/shop-context";

export default function SomePage() {
  const { currentShop, isLoading } = useShop();

  if (isLoading) return <div>Loading...</div>;
  if (!currentShop) return <div>No shop selected</div>;

  // Use currentShop instead of fetching /api/shops/my
}
```

---

## 🎯 PART 7: UPDATE BACKEND TO CREATE NEW SHOPS

**File:** `/server/routes/shops.ts`

**NEW endpoint:**
```
POST /api/shops/create
Body: { shopName, ownerName, phone, address, city, state, zip }
Response: { id, shopName, ... }
```

**Implementation:**

```typescript
router.post("/api/shops/create", async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const schema = z.object({
      shopName: z.string().min(1, "Shop name required"),
      ownerName: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    });

    const validated = schema.parse(req.body);

    const [newShop] = await db
      .insert(shops)
      .values({
        shopOwnerId: ownerId,
        shopName: validated.shopName,
        ownerName: validated.ownerName,
        phone: validated.phone,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        zip: validated.zip,
        isOnboarded: true, // Mark as onboarded since they're adding manually
      })
      .returning();

    res.json(newShop);
  } catch (error: any) {
    console.error("Error creating shop:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});
```

---

## ✅ PART 8: TESTING CHECKLIST

**Single Shop Owner (Backward Compatibility):**
- [ ] Owner with 1 shop sees NO shop selector (optional, or show it anyway)
- [ ] Dashboard works as before
- [ ] All admin pages work
- [ ] Can still access "My Shop" endpoint

**Multi-Shop Owner:**
- [ ] Owner with 2+ shops sees shop selector in header
- [ ] Dropdown lists all shops
- [ ] Can switch between shops
- [ ] Selected shop persists (localStorage)
- [ ] All admin pages show data for selected shop
- [ ] Can create new shop
- [ ] New shop appears in selector immediately
- [ ] Switching shops updates all pages

**New Shop Creation:**
- [ ] "Create New Shop" button in selector
- [ ] Form appears with all fields
- [ ] Submission creates new shop
- [ ] Redirects to dashboard with new shop selected
- [ ] New shop has unique QR code/kiosk URL

**API Endpoints:**
- [ ] GET `/api/shops/list` returns all shops
- [ ] GET `/api/shops/:shopId` returns specific shop (with ownership check)
- [ ] GET `/api/shops/my` still works (backward compatibility)
- [ ] POST `/api/shops/create` creates new shop

---

## 🎨 PART 9: UI/UX CONSIDERATIONS

**Shop Selector Visibility:**
- Option A: Always show (even with 1 shop) - shows "Create" option
- Option B: Only show with 2+ shops - cleaner for single-shop owners
- **Recommendation: Option A** - makes "Create New Shop" discoverable

**Persistence:**
- Selected shop saved to localStorage
- Persists across page reloads
- Each browser remembers independently

**Breadcrumbs (Optional Enhancement):**
- Show current shop name in page titles
- Example: "Dashboard - Main Street Vapes"

---

## 🚨 EDGE CASES TO HANDLE

**Case 1: Owner deletes current shop**
- Automatically switch to first remaining shop
- Show notification: "Shop deleted. Switched to [shop name]"

**Case 2: No shops at all**
- Redirect to onboarding (create first shop)
- This shouldn't happen but handle gracefully

**Case 3: Invalid shopId in localStorage**
- Fallback to first shop
- Clear bad localStorage value

**Case 4: Creating shop fails**
- Show error message
- Keep form data (don't clear)
- Allow retry

---

## 📊 EXPECTED OUTCOME

**Before:**
```
Owner with 2 shops:
- Can only see/manage first shop
- Second shop invisible in UI
- No way to switch or create more
```

**After:**
```
Owner with 2+ shops:
- Shop selector in header
- Can switch between all shops
- All admin pages respect current shop
- Can create additional shops
- Each shop has own QR/kiosk URL
```

**Database:**
```sql
-- One owner, multiple shops
SELECT * FROM shop_owners WHERE id = 'owner123';
-- Returns: 1 row

SELECT * FROM shops WHERE shop_owner_id = 'owner123';
-- Returns: 3 rows (3 shops for this owner)
```

---

## 🎯 SUCCESS CRITERIA

✅ **Multi-shop owner can:**
- See all their shops in selector
- Switch between shops easily
- All admin pages update when switching
- Create new shops
- Each shop has unique QR/kiosk

✅ **Single-shop owner:**
- Everything works as before
- No breaking changes
- Optional: Can create second shop

✅ **Kiosk mode:**
- Each kiosk URL still shop-specific
- Customer never sees shop selector
- Admin access works per-shop

✅ **Technical:**
- Context manages current shop
- localStorage remembers selection
- API validates shop ownership
- No race conditions

---

## 🚀 DEPLOYMENT NOTES

**Database:**
- No schema changes needed (already supports multi-shop)
- Existing shops continue to work

**Backward Compatibility:**
- `/api/shops/my` still works
- Single-shop owners see no changes
- No breaking changes to customer menu

**Future Enhancements:**
- Shop switcher keyboard shortcuts
- Recent shops list
- Shop favorites/pinning
- Shop-specific roles (manager, staff)

Good luck! This adds a powerful feature while maintaining backward compatibility! 🎉
