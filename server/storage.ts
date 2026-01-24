import {
  shops, brands, products, productVariants, shopProducts, customerFavorites, kioskSessions,
  type Shop, type InsertShop, type Brand, type InsertBrand, type Product, type InsertProduct,
  type ProductVariant, type InsertProductVariant, type ShopProduct, type InsertShopProduct,
  type CustomerFavorite, type InsertCustomerFavorite, type ProductWithBrand, type ShopProductWithDetails,
  type KioskSession, type InsertKioskSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, sql, asc, desc, lt } from "drizzle-orm";

export interface IStorage {
  // Shops
  getShop(id: string): Promise<Shop | undefined>;
  getShopByOwnerId(shopOwnerId: string): Promise<Shop | undefined>;
  getShopsByOwnerId(shopOwnerId: string): Promise<Shop[]>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop | undefined>;

  // Brands
  getBrand(id: string): Promise<Brand | undefined>;
  getAllBrands(): Promise<Brand[]>;
  searchBrands(query: string): Promise<{ id: string; brandName: string; similarity: number; logoUrl: string | null; productCount: number }[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;

  // Duplicate Detection
  searchDuplicateProducts(params: {
    brandId?: string;
    brandName?: string;
    productName: string;
    productType?: string;
    shopId?: string;
  }): Promise<{
    id: string;
    productName: string;
    productType: string;
    brandName: string;
    nicotineType: string | null;
    flavorCategory: string | null;
    flavorDescription: string | null;
    imageUrl: string | null;
    similarity: number;
    isCustom: boolean;
    variantCount: number;
    inShopMenu: boolean;
  }[]>;

  // Products
  getProduct(id: string): Promise<ProductWithBrand | undefined>;
  getProducts(filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]>;
  getGlobalProducts(filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]>;
  getShopCustomProducts(shopId: string, filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  getProductVariantsForShop(productId: string, shopId: string): Promise<ProductVariant[]>;
  createShopSpecificVariant(productId: string, shopId: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant>;
  checkVariantDuplicate(productId: string, nicotineLevel?: string, vgPgRatio?: string, bottleSize?: string): Promise<boolean>;

  // Shop Products
  getShopProducts(shopId: string): Promise<ShopProductWithDetails[]>;
  getShopMenuProducts(shopId: string, filters?: { search?: string; type?: string; flavor?: string; nicotineType?: string; limit?: number }): Promise<ProductWithBrand[]>;
  addProductToShop(shopProduct: InsertShopProduct): Promise<ShopProduct>;
  removeProductFromShop(shopId: string, productId: string): Promise<void>;
  updateShopProduct(id: string, data: Partial<InsertShopProduct>): Promise<ShopProduct | undefined>;
  reorderShopProducts(shopId: string, productIds: string[]): Promise<void>;
  isProductInShop(shopId: string, productId: string): Promise<boolean>;

  // Customer Favorites
  getCustomerFavorites(customerId: string, shopId: string): Promise<CustomerFavorite[]>;
  addFavorite(favorite: InsertCustomerFavorite): Promise<CustomerFavorite>;
  removeFavorite(customerId: string, productId: string, shopId: string): Promise<void>;
  isFavorite(customerId: string, productId: string, shopId: string): Promise<boolean>;

  // Kiosk Sessions
  createKioskSession(session: InsertKioskSession): Promise<KioskSession>;
  getKioskSession(id: string): Promise<KioskSession | undefined>;
  updateKioskSessionActivity(id: string): Promise<KioskSession | undefined>;
  clearShopKioskSessions(shopId: string): Promise<void>;
  deleteKioskSession(id: string): Promise<void>;
  cleanupExpiredKioskSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Shops
  async getShop(id: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.id, id));
    return shop;
  }

  async getShopByOwnerId(shopOwnerId: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.shopOwnerId, shopOwnerId));
    return shop;
  }

  async getShopsByOwnerId(shopOwnerId: string): Promise<Shop[]> {
    return db.select().from(shops).where(eq(shops.shopOwnerId, shopOwnerId)).orderBy(asc(shops.createdAt));
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const [newShop] = await db.insert(shops).values(shop).returning();
    return newShop;
  }

  async updateShop(id: string, data: Partial<InsertShop>): Promise<Shop | undefined> {
    const [updatedShop] = await db
      .update(shops)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shops.id, id))
      .returning();
    return updatedShop;
  }

  // Brands
  async getBrand(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async getAllBrands(): Promise<Brand[]> {
    return db.select().from(brands);
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async searchBrands(query: string): Promise<{ id: string; brandName: string; similarity: number; logoUrl: string | null; productCount: number }[]> {
    const results = await db.execute(sql`
      SELECT 
        b.id,
        b.brand_name as "brandName",
        b.logo_url as "logoUrl",
        SIMILARITY(b.brand_name, ${query}) as similarity,
        COUNT(p.id)::int as "productCount"
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id AND p.is_custom = false
      WHERE SIMILARITY(b.brand_name, ${query}) > 0.3
      GROUP BY b.id
      ORDER BY similarity DESC
      LIMIT 10
    `);
    return results.rows as { id: string; brandName: string; similarity: number; logoUrl: string | null; productCount: number }[];
  }

  // Duplicate Detection
  async searchDuplicateProducts(params: {
    brandId?: string;
    brandName?: string;
    productName: string;
    productType?: string;
    shopId?: string;
  }): Promise<{
    id: string;
    productName: string;
    productType: string;
    brandName: string;
    nicotineType: string | null;
    flavorCategory: string | null;
    flavorDescription: string | null;
    imageUrl: string | null;
    similarity: number;
    isCustom: boolean;
    variantCount: number;
    inShopMenu: boolean;
  }[]> {
    const { productName, brandName, brandId, productType, shopId } = params;
    
    const hasProductName = productName && productName.length >= 3;
    const hasBrandId = !!brandId;
    const hasBrandName = !hasBrandId && brandName && brandName.length >= 3;
    
    const results = await db.execute(sql`
      SELECT 
        p.id,
        p.product_name as "productName",
        p.product_type as "productType",
        COALESCE(b.brand_name, p.custom_brand_name, 'Unknown') as "brandName",
        p.nicotine_type as "nicotineType",
        p.flavor_category as "flavorCategory",
        p.flavor_description as "flavorDescription",
        p.image_url as "imageUrl",
        SIMILARITY(p.product_name, ${productName}) as similarity,
        p.is_custom as "isCustom",
        COUNT(DISTINCT pv.id)::int as "variantCount",
        CASE WHEN sp.product_id IS NOT NULL THEN true ELSE false END as "inShopMenu"
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN shop_products sp ON sp.product_id = p.id AND sp.shop_id = ${shopId || ''}
      WHERE p.is_custom = false
        AND ${hasProductName ? sql`SIMILARITY(p.product_name, ${productName}) > 0.3` : sql`false`}
        ${hasBrandId ? sql`AND p.brand_id = ${brandId}` : sql``}
        ${hasBrandName ? sql`AND (SIMILARITY(b.brand_name, ${brandName}) > 0.3 OR SIMILARITY(p.custom_brand_name, ${brandName}) > 0.3)` : sql``}
        ${productType ? sql`AND p.product_type = ${productType}` : sql``}
      GROUP BY p.id, b.brand_name, sp.product_id
      ORDER BY similarity DESC
      LIMIT 5
    `);
    
    return results.rows as {
      id: string;
      productName: string;
      productType: string;
      brandName: string;
      nicotineType: string | null;
      flavorCategory: string | null;
      flavorDescription: string | null;
      imageUrl: string | null;
      similarity: number;
      isCustom: boolean;
      variantCount: number;
      inShopMenu: boolean;
    }[];
  }

  // Products
  async getProduct(id: string): Promise<ProductWithBrand | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;

    const brand = product.brandId ? (await this.getBrand(product.brandId)) ?? null : null;
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));

    return { ...product, brand, variants };
  }

  async getProducts(filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]> {
    let query = db.select().from(products);
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(products.productName, `%${filters.search}%`),
          ilike(products.flavorDescription, `%${filters.search}%`)
        )
      );
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(eq(products.productType, filters.type));
    }

    if (filters?.flavor && filters.flavor !== "all") {
      conditions.push(eq(products.flavorCategory, filters.flavor));
    }

    const productList = conditions.length > 0
      ? await db.select().from(products).where(and(...conditions))
      : await db.select().from(products);

    const result: ProductWithBrand[] = [];
    for (const product of productList) {
      const brand = product.brandId ? (await this.getBrand(product.brandId)) ?? null : null;
      const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
      result.push({ ...product, brand, variants });
    }

    return result;
  }

  async getGlobalProducts(filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]> {
    const conditions = [eq(products.isCustom, false)];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(products.productName, `%${filters.search}%`),
          ilike(products.flavorDescription, `%${filters.search}%`)
        )!
      );
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(eq(products.productType, filters.type));
    }

    if (filters?.flavor && filters.flavor !== "all") {
      conditions.push(eq(products.flavorCategory, filters.flavor));
    }

    const productList = await db.select().from(products).where(and(...conditions));

    const result: ProductWithBrand[] = [];
    for (const product of productList) {
      const brand = product.brandId ? (await this.getBrand(product.brandId)) ?? null : null;
      const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
      result.push({ ...product, brand, variants });
    }

    return result;
  }

  async getShopCustomProducts(shopId: string, filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]> {
    const conditions = [eq(products.isCustom, true), eq(products.createdByShopId, shopId)];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(products.productName, `%${filters.search}%`),
          ilike(products.flavorDescription, `%${filters.search}%`)
        )!
      );
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(eq(products.productType, filters.type));
    }

    if (filters?.flavor && filters.flavor !== "all") {
      conditions.push(eq(products.flavorCategory, filters.flavor));
    }

    const productList = await db.select().from(products).where(and(...conditions));

    const result: ProductWithBrand[] = [];
    for (const product of productList) {
      const brand = product.brandId ? (await this.getBrand(product.brandId)) ?? null : null;
      const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id));
      result.push({ ...product, brand, variants });
    }

    return result;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(shopProducts).where(eq(shopProducts.productId, id));
    await db.delete(customerFavorites).where(eq(customerFavorites.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
  }

  async getProductVariantsForShop(productId: string, shopId: string): Promise<ProductVariant[]> {
    const variants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          or(
            eq(productVariants.isGlobal, true),
            eq(productVariants.createdByShopId, shopId)
          )
        )
      );
    return variants;
  }

  async createShopSpecificVariant(productId: string, shopId: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values({
      ...variant,
      productId,
      isGlobal: false,
      createdByShopId: shopId,
    }).returning();
    return newVariant;
  }

  async checkVariantDuplicate(productId: string, nicotineLevel?: string, vgPgRatio?: string, bottleSize?: string): Promise<boolean> {
    const conditions = [eq(productVariants.productId, productId)];
    
    if (nicotineLevel) conditions.push(eq(productVariants.nicotineLevel, nicotineLevel));
    if (vgPgRatio) conditions.push(eq(productVariants.vgPgRatio, vgPgRatio));
    if (bottleSize) conditions.push(eq(productVariants.bottleSize, bottleSize));
    
    const existing = await db
      .select()
      .from(productVariants)
      .where(and(...conditions))
      .limit(1);
    
    return existing.length > 0;
  }

  // Shop Products
  async getShopProducts(shopId: string): Promise<ShopProductWithDetails[]> {
    const shopProductsList = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.shopId, shopId))
      .orderBy(asc(shopProducts.displayOrder));

    const result: ShopProductWithDetails[] = [];
    for (const sp of shopProductsList) {
      const product = await this.getProduct(sp.productId);
      if (product) {
        result.push({ ...sp, product });
      }
    }

    return result;
  }

  async getShopMenuProducts(shopId: string, filters?: { search?: string; type?: string; flavor?: string; nicotineType?: string; limit?: number }): Promise<ProductWithBrand[]> {
    const shopProductsList = await db
      .select()
      .from(shopProducts)
      .where(and(eq(shopProducts.shopId, shopId), eq(shopProducts.isActive, true)))
      .orderBy(asc(shopProducts.displayOrder));

    const result: ProductWithBrand[] = [];
    for (const sp of shopProductsList) {
      const product = await this.getProduct(sp.productId);
      if (product) {
        let matches = true;

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          matches = product.productName.toLowerCase().includes(searchLower) ||
            (product.flavorDescription?.toLowerCase().includes(searchLower) || false) ||
            (product.brand?.brandName.toLowerCase().includes(searchLower) || false);
        }

        if (matches && filters?.type && filters.type !== "all") {
          matches = product.productType === filters.type;
        }

        if (matches && filters?.flavor && filters.flavor !== "all") {
          matches = product.flavorCategory === filters.flavor;
        }

        if (matches && filters?.nicotineType && filters.nicotineType !== "all") {
          matches = product.nicotineType === filters.nicotineType;
        }

        if (matches) {
          result.push(product);
          if (filters?.limit && result.length >= filters.limit) {
            break;
          }
        }
      }
    }

    return result;
  }

  async addProductToShop(shopProduct: InsertShopProduct): Promise<ShopProduct> {
    const existingProducts = await db
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.shopId, shopProduct.shopId));
    
    const displayOrder = existingProducts.length;

    const [newShopProduct] = await db
      .insert(shopProducts)
      .values({ ...shopProduct, displayOrder })
      .returning();
    return newShopProduct;
  }

  async removeProductFromShop(shopId: string, productId: string): Promise<void> {
    await db
      .delete(shopProducts)
      .where(and(eq(shopProducts.shopId, shopId), eq(shopProducts.productId, productId)));
  }

  async updateShopProduct(id: string, data: Partial<InsertShopProduct>): Promise<ShopProduct | undefined> {
    const [updated] = await db
      .update(shopProducts)
      .set(data)
      .where(eq(shopProducts.id, id))
      .returning();
    return updated;
  }

  async reorderShopProducts(shopId: string, productIds: string[]): Promise<void> {
    for (let i = 0; i < productIds.length; i++) {
      await db
        .update(shopProducts)
        .set({ displayOrder: i })
        .where(and(eq(shopProducts.shopId, shopId), eq(shopProducts.productId, productIds[i])));
    }
  }

  async isProductInShop(shopId: string, productId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(shopProducts)
      .where(and(eq(shopProducts.shopId, shopId), eq(shopProducts.productId, productId)));
    return !!existing;
  }

  // Customer Favorites
  async getCustomerFavorites(customerId: string, shopId: string): Promise<CustomerFavorite[]> {
    return db
      .select()
      .from(customerFavorites)
      .where(and(eq(customerFavorites.customerId, customerId), eq(customerFavorites.shopId, shopId)));
  }

  async addFavorite(favorite: InsertCustomerFavorite): Promise<CustomerFavorite> {
    const [newFavorite] = await db.insert(customerFavorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(customerId: string, productId: string, shopId: string): Promise<void> {
    await db
      .delete(customerFavorites)
      .where(
        and(
          eq(customerFavorites.customerId, customerId),
          eq(customerFavorites.productId, productId),
          eq(customerFavorites.shopId, shopId)
        )
      );
  }

  async isFavorite(customerId: string, productId: string, shopId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(customerFavorites)
      .where(
        and(
          eq(customerFavorites.customerId, customerId),
          eq(customerFavorites.productId, productId),
          eq(customerFavorites.shopId, shopId)
        )
      );
    return !!existing;
  }

  // Kiosk Sessions
  async createKioskSession(session: InsertKioskSession): Promise<KioskSession> {
    const [newSession] = await db.insert(kioskSessions).values(session).returning();
    return newSession;
  }

  async getKioskSession(id: string): Promise<KioskSession | undefined> {
    const [session] = await db.select().from(kioskSessions).where(eq(kioskSessions.id, id));
    return session;
  }

  async updateKioskSessionActivity(id: string): Promise<KioskSession | undefined> {
    const [updated] = await db
      .update(kioskSessions)
      .set({ lastActivity: new Date() })
      .where(eq(kioskSessions.id, id))
      .returning();
    return updated;
  }

  async clearShopKioskSessions(shopId: string): Promise<void> {
    await db.delete(kioskSessions).where(eq(kioskSessions.shopId, shopId));
  }

  async deleteKioskSession(id: string): Promise<void> {
    await db.delete(kioskSessions).where(eq(kioskSessions.id, id));
  }

  async cleanupExpiredKioskSessions(): Promise<void> {
    await db.delete(kioskSessions).where(lt(kioskSessions.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
