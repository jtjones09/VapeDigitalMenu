# PROMPT #1: RENAME USERS TABLE → SHOP_OWNERS

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Delete or lose any existing data
- ❌ Break Supabase authentication
- ❌ Modify the customers table
- ❌ Change any business logic (yet)
- ❌ Start working on multi-shop support (that's Prompt #2)

**DO:**
- ✅ RENAME `users` table to `shop_owners` 
- ✅ UPDATE all code references to use new name
- ✅ UPDATE foreign keys: `shops.userId` → `shops.shopOwnerId`
- ✅ RUN database migration safely
- ✅ TEST that shop owner login still works

---

## 📋 YOUR TASK

**Problem:** The `users` table name is confusing. It stores shop owners, not customers.

**Goal:** Rename `users` → `shop_owners` throughout the entire codebase for clarity.

**Outcome:** 
- Clear naming: `shop_owners` (owners) vs `customers` (customers)
- No functional changes - everything works exactly as before
- Clean foundation for multi-shop support (Prompt #2)

---

## 🗄️ STEP 1: UPDATE SCHEMA DEFINITION

**File:** `/shared/schema.ts`

**Find the `users` table** (around line 6 or wherever it's defined)

**Current:**
```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Change to:**
```typescript
export const shopOwners = pgTable("shop_owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShopOwnerSchema = createInsertSchema(shopOwners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShopOwner = z.infer<typeof insertShopOwnerSchema>;
export type ShopOwner = typeof shopOwners.$inferSelect;
```

**Also update the `shops` table foreign key reference:**

**Find this line in shops table:**
```typescript
userId: varchar("user_id").notNull(),
```

**Change to:**
```typescript
shopOwnerId: varchar("shop_owner_id")
  .references(() => shopOwners.id)
  .notNull(),
```

**Update relations if they exist:**
```typescript
export const shopsRelations = relations(shops, ({ one }) => ({
  owner: one(shopOwners, {
    fields: [shops.shopOwnerId],
    references: [shopOwners.id],
  }),
}));

export const shopOwnersRelations = relations(shopOwners, ({ many }) => ({
  shops: many(shops),
}));
```

---

## 🔍 STEP 2: FIND AND REPLACE ALL CODE REFERENCES

**Use global find-and-replace across the codebase:**

### Pattern 1: Import statements
**Find:** `import { users }`  
**Replace with:** `import { shopOwners }`

**Find:** `from(users)`  
**Replace with:** `from(shopOwners)`

### Pattern 2: Table references
**Find:** `users.id`  
**Replace with:** `shopOwners.id`

**Find:** `users.email`  
**Replace with:** `shopOwners.email`

**Find:** `users.createdAt`  
**Replace with:** `shopOwners.createdAt`

### Pattern 3: Foreign key in shops
**Find:** `shops.userId`  
**Replace with:** `shops.shopOwnerId`

**Find:** `user_id`  
**Replace with:** `shop_owner_id`

### Pattern 4: Type references
**Find:** `User` (the type)  
**Replace with:** `ShopOwner`

**Files likely to need updates:**
- `/shared/schema.ts` ✅ (already done)
- `/server/routes/shops.ts`
- `/server/routes/auth.ts` (if exists)
- `/server/routes/kiosk.ts`
- `/server/index.ts`
- Any middleware files
- Any API route files

**Use your IDE's "Find in Files" feature to search for:**
- `users.`
- `from(users)`
- `userId`
- `user_id`

---

## 🔄 STEP 3: RUN DATABASE MIGRATION

**After updating schema.ts, run:**

```bash
npm run db:push
```

**What this does:**
- Drizzle compares your schema to the database
- Generates SQL to rename `users` → `shop_owners`
- Renames `shops.user_id` → `shops.shop_owner_id`
- Updates foreign key constraints

**If Drizzle doesn't auto-generate the rename**, you may need to manually create:

**File:** `/server/migrations/rename_users_to_shop_owners.sql`

```sql
-- Rename the table
ALTER TABLE users RENAME TO shop_owners;

-- Rename the foreign key column
ALTER TABLE shops RENAME COLUMN user_id TO shop_owner_id;

-- Update the constraint (optional, for clarity)
ALTER TABLE shops 
  DROP CONSTRAINT IF EXISTS shops_user_id_fkey;

ALTER TABLE shops 
  ADD CONSTRAINT shops_shop_owner_id_fkey 
  FOREIGN KEY (shop_owner_id) 
  REFERENCES shop_owners(id);
```

---

## ✅ STEP 4: VERIFICATION CHECKLIST

**After completing the rename, test these:**

### Database Level:
- [ ] Run: `SELECT * FROM shop_owners LIMIT 1;` (should work)
- [ ] Run: `SELECT * FROM users LIMIT 1;` (should error - table doesn't exist)
- [ ] Check shops table: `SELECT shop_owner_id FROM shops LIMIT 1;` (should have data)
- [ ] Verify foreign key: `\d shops` in psql (should show FK to shop_owners)

### Application Level:
- [ ] Shop owner can login (`/login`)
- [ ] After login, redirects to `/admin`
- [ ] Admin dashboard loads
- [ ] "My Shop" data displays correctly
- [ ] Can navigate to all admin pages
- [ ] Settings page shows shop info
- [ ] No console errors in browser
- [ ] No errors in server logs

### API Endpoints:
- [ ] `GET /api/shops/my` returns shop data
- [ ] Shop owner authentication works
- [ ] All admin API calls work

---

## 🚨 COMMON ISSUES & FIXES

**Issue 1: "Table users does not exist"**
- **Cause:** Migration didn't run
- **Fix:** Run `npm run db:push` again

**Issue 2: "Column user_id does not exist"**
- **Cause:** Forgot to update a query somewhere
- **Fix:** Search codebase for `user_id` and update to `shop_owner_id`

**Issue 3: "Cannot find name 'users'"**
- **Cause:** Import statement not updated
- **Fix:** Change `import { users }` to `import { shopOwners }`

**Issue 4: Foreign key constraint error**
- **Cause:** Old FK references old table name
- **Fix:** Drop and recreate FK constraint (see migration SQL above)

---

## 📊 EXPECTED OUTCOME

**Before:**
```
Database:
├── users (shop owners) ❌ Confusing name
├── shops (user_id FK)
└── customers (clear)

Code:
import { users } from "@shared/schema";
await db.select().from(users);
```

**After:**
```
Database:
├── shop_owners (shop owners) ✅ Clear name
├── shops (shop_owner_id FK)
└── customers (clear)

Code:
import { shopOwners } from "@shared/schema";
await db.select().from(shopOwners);
```

**No functional changes** - just clearer naming!

---

## 🎯 SUCCESS CRITERIA

Before moving to Prompt #2 (Multi-Shop Support), verify:

✅ **Database:**
- `shop_owners` table exists
- `users` table does NOT exist
- `shops.shop_owner_id` column exists
- `shops.user_id` column does NOT exist
- Foreign key constraint works

✅ **Code:**
- No references to `users` table (except in comments)
- All imports use `shopOwners`
- All queries use `shopOwners`
- TypeScript types use `ShopOwner`

✅ **Application:**
- Shop owner login works
- Admin dashboard works
- All admin pages load
- No errors in console or logs

---

## 🚀 FINAL STEP: COMMIT AND VERIFY

**Before proceeding to Prompt #2:**

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "refactor: rename users table to shop_owners for clarity"
   ```

2. **Test thoroughly:**
   - Login as shop owner
   - Browse all admin pages
   - Check database directly

3. **Verify no errors:**
   - Browser console: No errors
   - Server logs: No errors
   - Database: Queries work

**Once verified, you're ready for Prompt #2: Multi-Shop Support! 🎉**

---

## ⏸️ STOP HERE

**Do NOT continue to multi-shop support until:**
- ✅ This rename is complete
- ✅ All tests pass
- ✅ You've verified everything works

**Tell me when you're ready for Prompt #2!**
