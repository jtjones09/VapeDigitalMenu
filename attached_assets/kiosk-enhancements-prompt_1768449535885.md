# KIOSK MODE ENHANCEMENTS - REPLIT AGENT PROMPT

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Break existing personal mode functionality
- ❌ Remove the current inactivity timer
- ❌ Change the URL parameter detection
- ❌ Modify shop owner admin portal

**DO:**
- ✅ ADD "Browse as Guest" button for kiosk mode
- ✅ ADD "Staff Reset" button for kiosk mode
- ✅ ADD visual distinction for kiosk mode (larger UI)
- ✅ ADD session tracking table
- ✅ IMPROVE auto-logout enforcement

---

## 📋 YOUR TASK

Enhance kiosk mode with:
1. "Browse as Guest" option (no login required)
2. "Staff Reset" button to clear session
3. Larger UI for kiosk (bigger buttons, fonts)
4. Server-side session tracking
5. Better auto-logout enforcement

---

## 🗄️ PART 1: ADD SESSIONS TABLE

**Update file:** `/shared/schema.ts`

**ADD this table AFTER the `customers` table:**

```typescript
// ============ SESSIONS ============
export const sessionModes = ["personal", "kiosk", "guest"] as const;

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Null for guest sessions
  shopId: varchar("shop_id").references(() => shops.id).notNull(),
  mode: varchar("mode", { length: 20 }).notNull(), // personal, kiosk, guest
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  shop: one(shops, {
    fields: [sessions.shopId],
    references: [shops.id],
  }),
}));

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type SessionMode = typeof sessionModes[number];
```

**Run database migration:**
```bash
npm run db:push
```

---

## 🎨 PART 2: CREATE GUEST MODE COMPONENT

**Create file:** `/client/src/components/guest-login.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, LogIn, Users } from "lucide-react";

interface GuestLoginProps {
  onLoginClick: () => void;
  onGuestClick: () => void;
}

export function GuestLogin({ onLoginClick, onGuestClick }: GuestLoginProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-2">
            <UserCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to VapeMenu</CardTitle>
          <CardDescription>
            Choose how you'd like to browse the menu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onLoginClick}
            className="w-full h-12 text-base"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Login with Email
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            onClick={onGuestClick}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <Users className="w-5 h-5 mr-2" />
            Browse as Guest
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Login to save favorites. Guest browsing is limited to viewing products only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🛡️ PART 3: CREATE STAFF RESET COMPONENT

**Create file:** `/client/src/components/staff-reset-button.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, RotateCcw } from "lucide-react";

interface StaffResetButtonProps {
  onReset: () => void;
}

export function StaffResetButton({ onReset }: StaffResetButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    setShowConfirm(false);
    onReset();
  };

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 px-6 shadow-lg"
        onClick={() => setShowConfirm(true)}
      >
        <Shield className="w-5 h-5 mr-2" />
        Staff Reset
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset Kiosk Session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the current session and return to the login screen.
              Any unsaved data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

---

## 📱 PART 4: UPDATE MENU PAGE WITH GUEST MODE & STAFF RESET

**Update file:** `/client/src/pages/menu/index.tsx`

**ADD these imports:**

```typescript
import { GuestLogin } from "@/components/guest-login";
import { StaffResetButton } from "@/components/staff-reset-button";
```

**ADD state for guest mode:**

```typescript
const [isGuestMode, setIsGuestMode] = useState(false);
const [showLoginModal, setShowLoginModal] = useState(false);
```

**ADD handler for guest browsing:**

```typescript
const handleGuestBrowse = () => {
  setIsGuestMode(true);
  // Track guest session
  fetch("/api/sessions/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId: params.shopId }),
  }).catch(console.error);
};
```

**ADD handler for staff reset:**

```typescript
const handleStaffReset = () => {
  // Clear local state
  setIsGuestMode(false);
  setShowLoginModal(false);
  
  // Logout if authenticated
  if (isAuthenticated) {
    logout();
  }
  
  // Clear session on server
  fetch("/api/sessions/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId: params.shopId }),
  }).catch(console.error);
  
  // Force reload
  window.location.reload();
};
```

**UPDATE the authentication check to handle guest mode:**

Replace the existing auth check with:

```typescript
// Show guest login screen in kiosk mode if not authenticated and not guest
if (isKioskMode && !isAuthenticated && !isGuestMode) {
  return (
    <GuestLogin
      onLoginClick={() => setShowLoginModal(true)}
      onGuestClick={handleGuestBrowse}
    />
  );
}

// Show login modal if requested
if (showLoginModal) {
  return (
    <LoginPage
      onSuccess={() => {
        setShowLoginModal(false);
        queryClient.invalidateQueries();
      }}
      onCancel={() => setShowLoginModal(false)}
    />
  );
}
```

**ADD staff reset button to the JSX:**

```typescript
// In the main return, add this before the closing div:
{isKioskMode && (
  <StaffResetButton onReset={handleStaffReset} />
)}
```

**ADD larger UI for kiosk mode:**

Wrap the main content with conditional classes:

```typescript
<div className={cn(
  "min-h-screen bg-background",
  isKioskMode && "text-lg" // Larger text in kiosk mode
)}>
  {/* existing content */}
</div>
```

---

## 🎨 PART 5: CREATE KIOSK-SPECIFIC STYLES

**Create file:** `/client/src/styles/kiosk.css`

```css
/* Kiosk Mode Specific Styles */
.kiosk-mode {
  /* Larger fonts */
  font-size: 18px;
}

.kiosk-mode h1 {
  font-size: 2.5rem;
}

.kiosk-mode h2 {
  font-size: 2rem;
}

.kiosk-mode h3 {
  font-size: 1.75rem;
}

.kiosk-mode p {
  font-size: 1.25rem;
}

/* Larger buttons */
.kiosk-mode button {
  min-height: 60px;
  font-size: 1.25rem;
  padding: 1rem 2rem;
}

/* Larger input fields */
.kiosk-mode input,
.kiosk-mode select {
  min-height: 60px;
  font-size: 1.25rem;
  padding: 1rem;
}

/* Larger product cards */
.kiosk-mode .product-card {
  min-width: 280px;
  padding: 1.5rem;
}

.kiosk-mode .product-card img {
  min-height: 220px;
}

.kiosk-mode .product-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

/* Larger icons */
.kiosk-mode svg {
  width: 1.75rem;
  height: 1.75rem;
}

/* Larger tap targets */
.kiosk-mode .favorite-button,
.kiosk-mode .filter-button {
  min-width: 60px;
  min-height: 60px;
}

/* Hide scrollbars in kiosk for cleaner look */
.kiosk-mode::-webkit-scrollbar {
  width: 8px;
}

.kiosk-mode::-webkit-scrollbar-track {
  background: transparent;
}

.kiosk-mode::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* Disable text selection in kiosk mode */
.kiosk-mode {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

**Import in `/client/src/index.css`:**

```css
@import './styles/kiosk.css';
```

**Apply class conditionally in menu page:**

```typescript
<div className={cn(
  "min-h-screen bg-background",
  isKioskMode && "kiosk-mode"
)}>
```

---

## 🔄 PART 6: CREATE SESSION TRACKING API

**Create file:** `/server/routes/sessions.ts`

```typescript
import { Router } from "express";
import { db } from "../db";
import { sessions } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";

const router = Router();

// Create guest session
router.post("/api/sessions/guest", async (req, res) => {
  try {
    const { shopId } = req.body;
    
    if (!shopId) {
      return res.status(400).json({ message: "Shop ID required" });
    }

    // Get shop's timeout settings
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    const timeoutMinutes = shop?.kioskTimeoutMinutes || 5;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

    const [session] = await db
      .insert(sessions)
      .values({
        userId: null, // Guest has no user ID
        shopId,
        mode: "guest",
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
      .returning();

    res.json(session);
  } catch (error: any) {
    console.error("Error creating guest session:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create authenticated session
router.post("/api/sessions/create", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { shopId, mode } = req.body;
    
    if (!shopId || !mode) {
      return res.status(400).json({ message: "Shop ID and mode required" });
    }

    // Get shop's timeout settings
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    // Personal mode: long expiration, Kiosk mode: shop's timeout
    let expiresAt = new Date();
    if (mode === "personal") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year
    } else {
      const timeoutMinutes = shop?.kioskTimeoutMinutes || 5;
      expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);
    }

    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        shopId,
        mode,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
      .returning();

    res.json(session);
  } catch (error: any) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update session activity (heartbeat)
router.post("/api/sessions/heartbeat", async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID required" });
    }

    const [updated] = await db
      .update(sessions)
      .set({
        lastActivity: new Date(),
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if session expired
    if (new Date() > new Date(updated.expiresAt)) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return res.status(410).json({ message: "Session expired" });
    }

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: error.message });
  }
});

// Clear all sessions for a shop (staff reset)
router.post("/api/sessions/clear", async (req, res) => {
  try {
    const { shopId } = req.body;
    
    if (!shopId) {
      return res.status(400).json({ message: "Shop ID required" });
    }

    await db
      .delete(sessions)
      .where(eq(sessions.shopId, shopId));

    res.json({ message: "Sessions cleared" });
  } catch (error: any) {
    console.error("Error clearing sessions:", error);
    res.status(500).json({ message: error.message });
  }
});

// Cleanup expired sessions (run periodically)
router.post("/api/sessions/cleanup", async (req, res) => {
  try {
    const result = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));

    res.json({ message: "Cleanup complete", deleted: result.rowCount || 0 });
  } catch (error: any) {
    console.error("Error cleaning up sessions:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

**Register in `/server/index.ts`:**

```typescript
import sessionRoutes from "./routes/sessions";

// ... existing routes ...
app.use(sessionRoutes);
```

---

## ⏲️ PART 7: ADD SESSION HEARTBEAT TO MENU

**Update file:** `/client/src/pages/menu/index.tsx`

**ADD session tracking state:**

```typescript
const [sessionId, setSessionId] = useState<string | null>(null);
```

**ADD heartbeat effect:**

```typescript
// Send heartbeat every 30 seconds to keep session alive
useEffect(() => {
  if (!sessionId || !isKioskMode) return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch("/api/sessions/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.status === 410) {
        // Session expired, logout
        handleStaffReset();
      }
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [sessionId, isKioskMode]);
```

**CREATE session on mount:**

```typescript
useEffect(() => {
  if (!isKioskMode || sessionId) return;

  const createSession = async () => {
    try {
      const mode = isGuestMode ? "guest" : "kiosk";
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          shopId: params.shopId,
          mode,
        }),
      });

      if (res.ok) {
        const session = await res.json();
        setSessionId(session.id);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  createSession();
}, [isKioskMode, isGuestMode, params.shopId, sessionId]);
```

---

## 🎯 PART 8: DISABLE FAVORITES IN GUEST MODE

**Update the favorite button in menu page:**

```typescript
// Disable favorites for guests
const canFavorite = !isGuestMode && isAuthenticated;

// In the favorite button JSX:
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleFavoriteToggle(product.id)}
  disabled={!canFavorite}
  className={cn(
    "absolute top-2 right-2",
    !canFavorite && "opacity-50 cursor-not-allowed"
  )}
>
  <Heart className={cn(
    "w-5 h-5",
    isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
  )} />
</Button>

// Show tooltip for guests
{!canFavorite && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-4 h-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      Login to save favorites
    </TooltipContent>
  </Tooltip>
)}
```

---

## ✅ TESTING CHECKLIST

**Guest Mode:**
- [ ] Navigate to `/menu/:shopId?mode=kiosk`
- [ ] See "Login" and "Browse as Guest" buttons
- [ ] Click "Browse as Guest"
- [ ] Can view products
- [ ] Cannot favorite products (button disabled)
- [ ] Guest session created in database

**Staff Reset:**
- [ ] "Staff Reset" button visible in kiosk mode
- [ ] Click button shows confirmation
- [ ] Confirm clears session
- [ ] Returns to login/guest screen
- [ ] Session deleted from database

**Kiosk UI:**
- [ ] Text is larger (18px base)
- [ ] Buttons are taller (60px min)
- [ ] Product cards are wider (280px min)
- [ ] Icons are bigger
- [ ] Tap targets are 60px+

**Session Tracking:**
- [ ] Sessions created in database
- [ ] Heartbeat updates `lastActivity`
- [ ] Expired sessions auto-logout
- [ ] Personal mode sessions persist (1 year)
- [ ] Kiosk sessions expire (5 min default)

**Personal Mode (unchanged):**
- [ ] No "Browse as Guest" option
- [ ] Normal font sizes
- [ ] No "Staff Reset" button
- [ ] Sessions persist indefinitely

---

## 📊 EXPECTED DATABASE STRUCTURE

```
sessions table:
├── id (uuid, primary key)
├── userId (varchar, nullable) → null for guests
├── shopId (varchar) → references shops.id
├── mode (varchar) → personal, kiosk, guest
├── lastActivity (timestamp)
├── expiresAt (timestamp)
├── ipAddress (varchar)
├── userAgent (varchar)
└── createdAt (timestamp)
```

---

## 🎯 FINAL VERIFICATION

**Run these queries:**

```sql
-- Check sessions table
SELECT * FROM sessions ORDER BY "createdAt" DESC LIMIT 10;

-- Check guest sessions
SELECT * FROM sessions WHERE "userId" IS NULL;

-- Check expired sessions
SELECT * FROM sessions WHERE "expiresAt" < NOW();

-- Cleanup expired
DELETE FROM sessions WHERE "expiresAt" < NOW();
```

---

## 🚀 DEPLOYMENT NOTES

**Cron Job (Optional):**
Set up a cron job to cleanup expired sessions:

```bash
# Every hour
0 * * * * curl -X POST http://localhost:5000/api/sessions/cleanup
```

**Shop Settings:**
- Default timeout: 5 minutes
- Configurable in `/admin/settings`
- Stored in `shops.kioskTimeoutMinutes`

Good luck! Remember: DO NOT break personal mode - only enhance kiosk mode.
