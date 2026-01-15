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
  getShopByUserId(userId: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop | undefined>;

  // Brands
  getBrand(id: string): Promise<Brand | undefined>;
  getAllBrands(): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;

  // Products
  getProduct(id: string): Promise<ProductWithBrand | undefined>;
  getProducts(filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;

  // Shop Products
  getShopProducts(shopId: string): Promise<ShopProductWithDetails[]>;
  getShopMenuProducts(shopId: string, filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]>;
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

  async getShopByUserId(userId: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.userId, userId));
    return shop;
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

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
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

  async getShopMenuProducts(shopId: string, filters?: { search?: string; type?: string; flavor?: string }): Promise<ProductWithBrand[]> {
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

        if (matches) {
          result.push(product);
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
