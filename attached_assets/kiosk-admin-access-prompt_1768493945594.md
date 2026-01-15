# KIOSK ADMIN ACCESS - REPLIT AGENT PROMPT

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Modify the existing customer login flow
- ❌ Allow customers to access admin dashboard
- ❌ Check the `customers` table for admin verification
- ❌ Break the existing admin portal authentication
- ❌ Remove any existing kiosk functionality

**DO:**
- ✅ ADD a discreet "Admin" link to kiosk welcome screen
- ✅ CREATE admin access modal with OTP verification
- ✅ VERIFY email against `users` table (shop owners only)
- ✅ CHECK that email belongs to THIS specific shop
- ✅ SEPARATE admin verification from customer verification

---

## 📋 YOUR TASK

**Problem:** Shop owners need to exit kiosk mode and access admin dashboard, but customers shouldn't be able to navigate away.

**Solution:** Add secure admin access from kiosk mode with:
1. Discreet "Admin" link on kiosk welcome screen (bottom-left, muted text)
2. Admin access modal with email + OTP verification
3. Backend verification: email must own THIS specific shop
4. Redirect to `/admin` dashboard on success

---

## 🔐 DATABASE & SECURITY CONTEXT

**Key Tables:**
- **Shop Owners:** `users` table → linked to `shops` table via `shops.userId`
- **Customers:** `customers` table (completely separate, never checked)

**Critical Security Rule:**
Only verify against `users` table. A person could have BOTH a shop owner account AND a customer account with the same email - we specifically verify against the shop owner record ONLY.

**Example Scenarios:**
```
✅ ALLOWED:
Email: owner@example.com
Shop ID: abc123
Condition: owner@example.com in users table AND owns shop abc123
Result: Access granted

❌ DENIED:
Email: owner@example.com
Shop ID: xyz789
Condition: owner@example.com owns shop abc123 (different shop)
Result: "Email not authorized for this shop"

❌ DENIED:
Email: customer@example.com
Shop ID: abc123
Condition: customer@example.com only in customers table, not users
Result: "Email not authorized for this shop"
```

---

## 🎨 PART 1: ADD ADMIN LINK TO KIOSK WELCOME SCREEN

**Update file:** `/client/src/components/guest-login.tsx`

**Current state:** Component has "Login" and "Browse as Guest" buttons

**Add this:** Small "Admin" link at the bottom, styled to be discreet

**Styling requirements:**
- Position: Bottom-left or center (your choice, but DISCREET)
- Font size: `text-xs` (0.75rem)
- Color: `text-muted-foreground` (low contrast)
- Hover: Slightly brighter, underline appears
- Should NOT draw customer attention

**Behavior:**
- Clicking opens `AdminAccessModal`
- Modal prop: `shopId` (passed from menu page)

---

## 🔑 PART 2: CREATE ADMIN ACCESS MODAL

**Create file:** `/client/src/components/admin-access-modal.tsx`

**Two-step flow:**

### Step 1: Email Input
- Label: "Shop Owner Email"
- Input type: email
- Icon: Mail icon (left side of input)
- Placeholder: "owner@example.com"
- Helper text: "Only the shop owner can access the admin dashboard"
- Buttons: "Cancel" (outline) and "Continue" (primary)

### Step 2: OTP Verification
- Label: "Verification Code"
- Input: 6-digit OTP boxes (use InputOTP component)
- Helper text: "Code sent to {email}"
- Button: "Back to Email" (ghost variant)
- Auto-submit when 6 digits entered

**State management:**
- Track current step: "email" or "verify"
- Store email value
- Store OTP value
- Handle loading states during API calls

**Error handling:**
- Invalid email format → Show validation error
- Email not authorized → "Email not authorized for this shop"
- Invalid OTP → "Invalid code, please try again"
- Network error → Generic error message

---

## 🔒 PART 3: BACKEND VERIFICATION ENDPOINT

**Create file:** `/server/routes/kiosk.ts`

### Endpoint 1: Verify Shop Owner

```
POST /api/kiosk/admin-access
Body: { email: string, shopId: string }
```

**Logic:**
1. Validate request body (email must be valid format, shopId required)
2. Query database with JOIN:
   ```sql
   SELECT users.id, users.email, shops.id, shops.shop_name
   FROM users
   INNER JOIN shops ON shops.user_id = users.id
   WHERE users.email = ? AND shops.id = ?
   ```
3. If NO results → Return 403 "Email not authorized for this shop"
4. If result found → Return 200 { authorized: true, email, shopName }

**IMPORTANT:** This endpoint does NOT send OTP. It only verifies authorization. The frontend sends OTP via Supabase directly after successful authorization.

**Drizzle ORM syntax:**
```typescript
const result = await db
  .select({
    userId: users.id,
    userEmail: users.email,
    shopId: shops.id,
    shopName: shops.shopName,
  })
  .from(users)
  .innerJoin(shops, eq(shops.userId, users.id))
  .where(
    and(
      eq(users.email, email),
      eq(shops.id, shopId)
    )
  )
  .limit(1);
```

---

## 📱 PART 4: FRONTEND FLOW IMPLEMENTATION

**In the modal component:**

### Email Submission Flow:
1. User enters email and clicks "Continue"
2. Call `POST /api/kiosk/admin-access` with email + shopId
3. If authorized:
   - Call Supabase: `supabase.auth.signInWithOtp({ email, shouldCreateUser: false })`
   - Show success toast: "OTP sent to your email"
   - Switch to Step 2 (OTP input)
4. If not authorized:
   - Show error toast: "Email not authorized for this shop"
   - Keep on Step 1, allow retry

### OTP Verification Flow:
1. User enters 6-digit code (auto-submits when complete)
2. Call Supabase: `supabase.auth.verifyOtp({ email, token, type: "email" })`
3. If verified:
   - Invalidate all queries: `queryClient.invalidateQueries()`
   - Show success toast: "Access granted, redirecting..."
   - Redirect to `/admin` after 500ms delay
4. If invalid:
   - Show error toast: "Invalid code"
   - Clear OTP input, allow retry

**Back button:** Returns from Step 2 to Step 1, clears OTP

**Cancel/Close:** Resets modal state, closes modal

---

## 🛡️ PART 5: ADD RATE LIMITING (OPTIONAL BUT RECOMMENDED)

**Create file:** `/server/middleware/rate-limit.ts`

**Simple in-memory rate limiter:**
- Track attempts by IP address
- Limit: 5 attempts per 15 minutes
- Return 429 "Too many attempts" when exceeded
- Cleanup expired entries every 60 seconds

**Apply to endpoint:**
```typescript
router.post(
  "/api/kiosk/admin-access", 
  rateLimitByIP(5, 15 * 60 * 1000),
  // ... handler
);
```

If you don't want to implement rate limiting now, skip this part.

---

## ✅ TESTING CHECKLIST

**Happy Path:**
- [ ] Navigate to `/menu/:shopId?mode=kiosk`
- [ ] Click "Browse as Guest"
- [ ] See "Admin" link (discreet, bottom of card)
- [ ] Click "Admin" → Modal opens
- [ ] Enter shop owner email → "Continue"
- [ ] OTP sent notification
- [ ] Enter 6-digit OTP
- [ ] Redirects to `/admin/dashboard`
- [ ] Admin session persists

**Security Tests:**
- [ ] Try random email → 403 error
- [ ] Try customer email (only in customers table) → 403 error
- [ ] Try shop owner from different shop → 403 error
- [ ] Try wrong OTP → Invalid code error
- [ ] Try expired OTP → Supabase handles gracefully

**Edge Cases:**
- [ ] Click Cancel → Modal closes
- [ ] Click Back from OTP → Returns to email input
- [ ] Close modal (X) → Resets state completely
- [ ] Submit invalid email format → Validation error

---

## 🔍 SQL QUERY EXPLANATION

**Why this works securely:**

```sql
SELECT users.*, shops.*
FROM users
INNER JOIN shops ON shops.user_id = users.id
WHERE users.email = 'owner@example.com'
  AND shops.id = 'abc123'
```

This query ensures:
1. ✅ Email exists in `users` table (shop owner)
2. ✅ Email is linked to a shop via `shops.userId`
3. ✅ That shop matches the requested `shopId`
4. ❌ Cannot access if email not in users
5. ❌ Cannot access other shops
6. ❌ Never checks customers table

**The INNER JOIN is critical** - it requires BOTH conditions to be true.

---

## 📊 EXPECTED BEHAVIOR EXAMPLES

**Test Case 1: Valid Owner**
```
Input: 
  email: owner@vapeshop.com
  shopId: abc123 (owned by owner@vapeshop.com)

Backend Query Result: 1 row found
Frontend: OTP sent ✅
Result: Access granted after OTP
```

**Test Case 2: Wrong Shop**
```
Input:
  email: owner@vapeshop.com (owns shop xyz789)
  shopId: abc123 (different shop)

Backend Query Result: 0 rows found
Frontend: Error message ❌
Result: "Email not authorized for this shop"
```

**Test Case 3: Customer Email**
```
Input:
  email: customer@example.com (only in customers table)
  shopId: abc123

Backend Query Result: 0 rows found (customers table never joined)
Frontend: Error message ❌
Result: "Email not authorized for this shop"
```

---

## 🎯 UI/UX SPECIFICATIONS

**Admin Link:**
- Font: 12px (0.75rem)
- Color: muted-foreground with 70% opacity
- Hover: 100% opacity, underline
- Position: Center bottom or left bottom
- Text: Simply "Admin" (no icon)

**Modal Dimensions:**
- Width: 448px (sm:max-w-md)
- Padding: 1.5rem
- Border radius: 8px
- Shadow: lg

**Email Input:**
- Height: 48px
- Icon: Mail (left side, 16px)
- Padding-left: 40px (pl-10)

**OTP Input:**
- 6 boxes, each 48x48px
- Centered horizontally
- Font size: 32px
- Auto-focus first box
- Auto-advance on type
- Auto-submit when complete

---

## 🚀 IMPLEMENTATION ORDER

1. **Backend endpoint first** (`/api/kiosk/admin-access`)
2. **Test with curl** to verify SQL query
3. **Create modal component** (UI only, no logic)
4. **Connect modal to backend** (email verification)
5. **Add Supabase OTP** (both send and verify)
6. **Add admin link** to GuestLogin
7. **Test full flow** end-to-end
8. **Add rate limiting** (if desired)

---

## 📝 FINAL VERIFICATION QUERIES

Run these to verify your implementation:

```sql
-- Get shop owner for a specific shop
SELECT u.email, s.shop_name 
FROM users u
JOIN shops s ON s.user_id = u.id
WHERE s.id = 'YOUR_SHOP_ID';

-- Test the JOIN logic
SELECT u.email, s.shop_name
FROM users u
INNER JOIN shops s ON s.user_id = u.id
WHERE u.email = 'test@example.com' 
  AND s.id = 'test-shop-id';
-- Should return 1 row if authorized, 0 if not

-- Verify no customers are in users table (they shouldn't be)
SELECT COUNT(*) FROM users WHERE email IN (SELECT email FROM customers);
-- Should be 0 unless someone is both owner and customer
```

---

## ✅ SUCCESS CRITERIA

After implementation:
- ✅ Shop owners can exit kiosk and access admin
- ✅ Customers cannot access admin (ever)
- ✅ Admin link is professional and discreet
- ✅ Security is shop-specific (can't access other shops)
- ✅ OTP flow is smooth and intuitive
- ✅ Error messages are clear but don't leak info
- ✅ Rate limiting prevents brute force (optional)

---

## 🎁 BONUS: LOGGING (OPTIONAL)

Consider logging admin access attempts:

```typescript
// In the backend endpoint
console.log(`Admin access attempt: ${email} for shop ${shopId} from IP ${req.ip}`);

// On success
console.log(`Admin access GRANTED: ${email} for shop ${shopId}`);

// On failure
console.log(`Admin access DENIED: ${email} for shop ${shopId} - not authorized`);
```

This helps with:
- Security monitoring
- Debugging issues
- Audit trail

---

Good luck! The key to this feature is the SQL INNER JOIN that verifies BOTH email ownership AND shop ownership in a single query. Everything else is standard OTP flow.
