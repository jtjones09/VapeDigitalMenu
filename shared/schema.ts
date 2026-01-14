import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// ============ SHOPS ============
export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  isOnboarded: boolean("is_onboarded").default(false),
  kioskTimeoutMinutes: integer("kiosk_timeout_minutes").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;

// ============ BRANDS ============
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  website: varchar("website", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
});

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

// ============ PRODUCTS ============
export const productTypes = ["e-liquid", "disposable", "hardware", "accessory"] as const;
export const flavorCategories = ["fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other"] as const;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productType: varchar("product_type", { length: 50 }).notNull(),
  flavorCategory: varchar("flavor_category", { length: 50 }),
  flavorDescription: text("flavor_description"),
  imageUrl: varchar("image_url", { length: 500 }),
  isCustom: boolean("is_custom").default(false),
  createdByShopId: varchar("created_by_shop_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ============ PRODUCT VARIANTS ============
export const nicotineLevels = ["0mg", "3mg", "6mg", "12mg", "18mg", "24mg", "50mg"] as const;
export const vgPgRatios = ["50/50", "60/40", "70/30", "80/20", "MAX VG"] as const;
export const bottleSizes = ["10ml", "30ml", "60ml", "100ml", "120ml"] as const;

export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  nicotineLevel: varchar("nicotine_level", { length: 20 }),
  vgPgRatio: varchar("vg_pg_ratio", { length: 20 }),
  bottleSize: varchar("bottle_size", { length: 20 }),
  sku: varchar("sku", { length: 100 }),
  msrp: decimal("msrp", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
});

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

// ============ SHOP PRODUCTS (Junction) ============
export const shopProducts = pgTable("shop_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id").references(() => shops.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  customPrice: decimal("custom_price", { precision: 10, scale: 2 }),
  addedAt: timestamp("added_at").defaultNow(),
});

export const shopProductsRelations = relations(shopProducts, ({ one }) => ({
  shop: one(shops, {
    fields: [shopProducts.shopId],
    references: [shops.id],
  }),
  product: one(products, {
    fields: [shopProducts.productId],
    references: [products.id],
  }),
}));

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({
  id: true,
  addedAt: true,
});

export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
export type ShopProduct = typeof shopProducts.$inferSelect;

// ============ CUSTOMER FAVORITES ============
export const customerFavorites = pgTable("customer_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  shopId: varchar("shop_id").references(() => shops.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerFavoritesRelations = relations(customerFavorites, ({ one }) => ({
  product: one(products, {
    fields: [customerFavorites.productId],
    references: [products.id],
  }),
  shop: one(shops, {
    fields: [customerFavorites.shopId],
    references: [shops.id],
  }),
}));

export const insertCustomerFavoriteSchema = createInsertSchema(customerFavorites).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomerFavorite = z.infer<typeof insertCustomerFavoriteSchema>;
export type CustomerFavorite = typeof customerFavorites.$inferSelect;

// ============ EXTENDED TYPES ============
export type ProductWithBrand = Product & {
  brand: Brand | null;
  variants: ProductVariant[];
};

export type ShopProductWithDetails = ShopProduct & {
  product: ProductWithBrand;
};
