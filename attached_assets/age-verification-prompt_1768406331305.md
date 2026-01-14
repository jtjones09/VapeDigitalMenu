# AGE VERIFICATION IMPLEMENTATION - REPLIT AGENT PROMPT

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Modify existing authentication flow for shop owners
- ❌ Delete or change the existing Supabase auth setup
- ❌ Remove any existing user functionality
- ❌ Change the database schema for existing tables

**DO:**
- ✅ ADD customers table to database schema
- ✅ ADD age verification flow for customer login
- ✅ ADD DOB collection on first customer login
- ✅ ADD 18+ age check before allowing access
- ✅ KEEP shop owner login unchanged

---

## 📋 YOUR TASK

Implement age verification for customers (18+ requirement) with:
1. New `customers` table in database
2. DOB collection on first login
3. Age calculation (must be >= 18)
4. Block underage users
5. Store customer profile data

**IMPORTANT:** Shop owners should NOT go through this flow - only customers accessing `/menu/:shopId` routes.

---

## 🗄️ PART 1: ADD CUSTOMERS TABLE TO SCHEMA

**Update file:** `/shared/schema.ts`

**ADD this table definition AFTER the `customerFavorites` table (around line 177):**

```typescript
// ============ CUSTOMERS ============
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // Supabase Auth user ID
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  dateOfBirth: varchar("date_of_birth", { length: 10 }), // YYYY-MM-DD format
  isAgeVerified: boolean("is_age_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
```

**Run database migration:**
```bash
npm run db:push
```

---

## 🎯 PART 2: CREATE CUSTOMER API ENDPOINTS

**Create file:** `/server/routes/customers.ts`

```typescript
import { Router } from "express";
import { db } from "../db";
import { customers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get current customer profile
router.get("/api/customers/me", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create/update customer profile with age verification
router.post("/api/customers/verify-age", async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const schema = z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    });

    const validated = schema.parse(req.body);

    // Calculate age
    const birthDate = new Date(validated.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Check if user is 18+
    if (age < 18) {
      return res.status(403).json({ 
        message: "You must be 18 or older to access this service",
        isAgeVerified: false 
      });
    }

    // Check if customer already exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
    });

    let customer;

    if (existingCustomer) {
      // Update existing customer
      const [updated] = await db
        .update(customers)
        .set({
          firstName: validated.firstName,
          lastName: validated.lastName,
          dateOfBirth: validated.dateOfBirth,
          isAgeVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(customers.userId, userId))
        .returning();
      
      customer = updated;
    } else {
      // Create new customer
      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          email: userEmail,
          firstName: validated.firstName,
          lastName: validated.lastName,
          dateOfBirth: validated.dateOfBirth,
          isAgeVerified: true,
        })
        .returning();
      
      customer = newCustomer;
    }

    res.json(customer);
  } catch (error: any) {
    console.error("Error verifying age:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

**Register the route in `/server/index.ts`:**

```typescript
import customerRoutes from "./routes/customers";

// ... existing routes ...
app.use(customerRoutes);
```

---

## 🎨 PART 3: CREATE AGE VERIFICATION MODAL COMPONENT

**Create file:** `/client/src/components/age-verification-modal.tsx`

```typescript
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertCircle, Loader2 } from "lucide-react";
import type { Customer } from "@shared/schema";

interface AgeVerificationModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function AgeVerificationModal({ open, onSuccess }: AgeVerificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const verifyAgeMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; dateOfBirth: string }) => {
      return await apiRequest<Customer>({
        url: "/api/customers/verify-age",
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      toast({
        title: "Age Verified!",
        description: "Welcome to VapeMenu. You can now browse the menu.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.message || "Failed to verify age";
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    verifyAgeMutation.mutate({ firstName, lastName, dateOfBirth });
  };

  // Calculate max date (must be at least 18 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            You must be 18 or older to access this service. Please provide your information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={verifyAgeMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={verifyAgeMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              max={maxDateString}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              disabled={verifyAgeMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              You must be 18 or older to continue
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              By continuing, you confirm that you are at least 18 years of age and agree to our terms of service.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={verifyAgeMutation.isPending}
          >
            {verifyAgeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔐 PART 4: ADD AGE VERIFICATION TO CUSTOMER MENU

**Update file:** `/client/src/pages/menu/index.tsx`

**ADD these imports at the top:**

```typescript
import { AgeVerificationModal } from "@/components/age-verification-modal";
import type { Customer } from "@shared/schema";
```

**ADD this query INSIDE the Menu component (after existing queries):**

```typescript
// Check if customer profile exists and is age verified
const { data: customer, isLoading: customerLoading } = useQuery<Customer | null>({
  queryKey: ["/api/customers/me"],
  enabled: isAuthenticated && !isKioskMode, // Only for personal mode
  retry: false,
  queryFn: async () => {
    const res = await fetch("/api/customers/me", {
      headers: await getAuthHeaders(),
      credentials: "include",
    });
    if (res.status === 404) {
      return null; // Customer doesn't exist yet
    }
    if (!res.ok) {
      throw new Error(`${res.status}: ${await res.text()}`);
    }
    return res.json();
  },
});

// Determine if we need to show age verification
const needsAgeVerification = isAuthenticated && !isKioskMode && !customer?.isAgeVerified;
```

**ADD state for modal:**

```typescript
const [showAgeVerification, setShowAgeVerification] = useState(false);
```

**ADD useEffect to trigger modal:**

```typescript
useEffect(() => {
  if (needsAgeVerification && !customerLoading) {
    setShowAgeVerification(true);
  }
}, [needsAgeVerification, customerLoading]);
```

**ADD the modal component in the JSX (before the main return):**

```typescript
// Show age verification modal if needed
if (showAgeVerification) {
  return (
    <div className="min-h-screen bg-background">
      <AgeVerificationModal
        open={showAgeVerification}
        onSuccess={() => setShowAgeVerification(false)}
      />
    </div>
  );
}

// Rest of existing return statement...
```

---

## 🚫 PART 5: ADD UNDERAGE USER BLOCKING

**Create file:** `/client/src/components/age-restricted.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AgeRestricted() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Age Restricted</CardTitle>
          <CardDescription className="text-base">
            You must be 18 years or older to access this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Our products are intended for adults only. If you believe this is an error, please contact support.
          </p>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full"
          >
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Update the verification flow to handle underage users:**

In `/client/src/components/age-verification-modal.tsx`, update the `onError` handler:

```typescript
onError: (error: any) => {
  const message = error.message || "Failed to verify age";
  
  // If user is underage, show permanent block
  if (error.status === 403) {
    toast({
      title: "Age Restriction",
      description: "You must be 18 or older to access this service",
      variant: "destructive",
    });
    // Redirect to blocked page after 2 seconds
    setTimeout(() => {
      window.location.href = "/age-restricted";
    }, 2000);
  } else {
    toast({
      title: "Verification Failed",
      description: message,
      variant: "destructive",
    });
  }
},
```

**Add route for age restricted page in `/client/src/App.tsx`:**

```typescript
import { AgeRestricted } from "@/components/age-restricted";

// Add this route in the Router component
<Route path="/age-restricted" component={AgeRestricted} />
```

---

## 📊 PART 6: UPDATE CUSTOMER FAVORITES TO USE CUSTOMER TABLE

**Update file:** `/shared/schema.ts`

**MODIFY the customerFavorites table to reference the customers table:**

```typescript
// Change this line (around line 153):
customerId: varchar("customer_id").notNull(),

// To this:
customerId: varchar("customer_id")
  .references(() => customers.id)
  .notNull(),
```

**Add relation:**

```typescript
export const customerFavoritesRelations = relations(customerFavorites, ({ one }) => ({
  product: one(products, {
    fields: [customerFavorites.productId],
    references: [products.id],
  }),
  shop: one(shops, {
    fields: [customerFavorites.shopId],
    references: [shops.id],
  }),
  customer: one(customers, {
    fields: [customerFavorites.customerId],
    references: [customers.id],
  }),
}));
```

---

## 🔄 PART 7: UPDATE FAVORITES API TO USE CUSTOMER ID

**Update file:** `/server/routes/favorites.ts` (if it exists, or create it)**

```typescript
import { Router } from "express";
import { db } from "../db";
import { customerFavorites, customers } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get customer's favorites for a shop
router.get("/api/favorites/:shopId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { shopId } = req.params;

    // Get customer by userId
    const customer = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
    });

    if (!customer) {
      return res.json([]); // No customer profile = no favorites
    }

    const favorites = await db.query.customerFavorites.findMany({
      where: and(
        eq(customerFavorites.customerId, customer.id),
        eq(customerFavorites.shopId, shopId)
      ),
    });

    res.json(favorites);
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add favorite
router.post("/api/favorites", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { productId, shopId } = req.body;

    // Get customer by userId
    const customer = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    // Check if already favorited
    const existing = await db.query.customerFavorites.findFirst({
      where: and(
        eq(customerFavorites.customerId, customer.id),
        eq(customerFavorites.productId, productId),
        eq(customerFavorites.shopId, shopId)
      ),
    });

    if (existing) {
      return res.status(400).json({ message: "Already favorited" });
    }

    const [favorite] = await db
      .insert(customerFavorites)
      .values({
        customerId: customer.id,
        productId,
        shopId,
      })
      .returning();

    res.json(favorite);
  } catch (error: any) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: error.message });
  }
});

// Remove favorite
router.delete("/api/favorites/:productId/:shopId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { productId, shopId } = req.params;

    // Get customer by userId
    const customer = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    await db
      .delete(customerFavorites)
      .where(
        and(
          eq(customerFavorites.customerId, customer.id),
          eq(customerFavorites.productId, productId),
          eq(customerFavorites.shopId, shopId)
        )
      );

    res.json({ message: "Favorite removed" });
  } catch (error: any) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

**Register in `/server/index.ts`:**

```typescript
import favoritesRoutes from "./routes/favorites";

// ... existing routes ...
app.use(favoritesRoutes);
```

---

## ✅ TESTING CHECKLIST

After implementation, test:

**New Customer Flow:**
- [ ] Navigate to `/menu/:shopId` as new customer
- [ ] Complete OTP login
- [ ] Age verification modal appears
- [ ] Enter first name, last name, DOB (18+)
- [ ] Modal closes, menu loads
- [ ] Customer record created in database
- [ ] `isAgeVerified: true` in database

**Underage User:**
- [ ] Try to verify with DOB < 18 years ago
- [ ] Error message appears
- [ ] User is redirected to `/age-restricted` page
- [ ] Cannot access menu

**Existing Customer:**
- [ ] Log out and log back in
- [ ] Age verification modal does NOT appear
- [ ] Menu loads immediately
- [ ] Customer data persists

**Shop Owner:**
- [ ] Shop owner login still works
- [ ] No age verification for shop owners
- [ ] Admin portal accessible

**Favorites:**
- [ ] Add favorite as customer
- [ ] Favorite linked to customer.id (not userId)
- [ ] Favorites persist across sessions

---

## 📊 EXPECTED DATABASE STRUCTURE

After implementation:

```
customers table:
├── id (uuid, primary key)
├── userId (varchar, unique) → Supabase Auth user
├── email (varchar)
├── firstName (varchar)
├── lastName (varchar)
├── dateOfBirth (varchar, YYYY-MM-DD)
├── isAgeVerified (boolean, default false)
├── createdAt (timestamp)
└── updatedAt (timestamp)

customer_favorites table:
├── id (uuid, primary key)
├── customerId (varchar) → references customers.id
├── productId (varchar) → references products.id
├── shopId (varchar) → references shops.id
└── createdAt (timestamp)
```

---

## 🎯 FINAL VERIFICATION

Run these queries to verify:

```sql
-- Check customers table exists
SELECT * FROM customers LIMIT 1;

-- Check customer age verification
SELECT id, email, "firstName", "lastName", "isAgeVerified" 
FROM customers;

-- Check favorites are linked to customers
SELECT cf.*, c."firstName", c."lastName"
FROM customer_favorites cf
JOIN customers c ON c.id = cf."customerId"
LIMIT 10;
```

---

## 🚀 DEPLOYMENT NOTES

**Legal Compliance:**
- Age verification is legally required for vape products
- DOB is stored but never shared externally
- Users must be 18+ to access customer menu
- Shop owners are exempt (B2B portal)

**Privacy:**
- Customer data stored in compliance with regulations
- DOB only used for age calculation
- No third-party age verification service (for MVP)

Good luck! Remember: DO NOT modify shop owner authentication - only add customer verification.
