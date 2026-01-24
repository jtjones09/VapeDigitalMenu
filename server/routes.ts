import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, type AuthenticatedRequest } from "./auth/supabase";
import { insertShopSchema, insertShopProductSchema, insertCustomerFavoriteSchema, customers, insertKioskSessionSchema, shops, shopOwners } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ SHOPS ============
  
  // Get all shops for the authenticated owner
  app.get("/api/shops/list", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const allShops = await storage.getShopsByOwnerId(shopOwnerId);
      res.json(allShops);
    } catch (error) {
      console.error("Error fetching shops:", error);
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });

  // Get current shop owner's shop (backward compatibility - returns first shop)
  app.get("/api/shops/my", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const allShops = await storage.getShopsByOwnerId(shopOwnerId);
      
      if (allShops.length === 0) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      res.json(allShops[0]);
    } catch (error) {
      console.error("Error fetching shop:", error);
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });

  // Create shop (first shop during onboarding)
  app.post("/api/shops", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      
      const existingShop = await storage.getShopByOwnerId(shopOwnerId);
      if (existingShop) {
        return res.status(400).json({ message: "Shop already exists. Use /api/shops/create for additional shops." });
      }

      const data = insertShopSchema.parse({
        ...req.body,
        shopOwnerId,
        isOnboarded: true,
      });

      const shop = await storage.createShop(data);
      res.status(201).json(shop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating shop:", error);
      res.status(500).json({ message: "Failed to create shop" });
    }
  });

  // Create additional shop (multi-shop support)
  app.post("/api/shops/create", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;

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

      const shop = await storage.createShop({
        shopOwnerId,
        shopName: validated.shopName,
        ownerName: validated.ownerName || null,
        phone: validated.phone || null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        zip: validated.zip || null,
        isOnboarded: true,
      });

      res.status(201).json(shop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating shop:", error);
      res.status(500).json({ message: "Failed to create shop" });
    }
  });

  // Update shop
  app.patch("/api/shops/my", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const updatedShop = await storage.updateShop(shop.id, req.body);
      res.json(updatedShop);
    } catch (error) {
      console.error("Error updating shop:", error);
      res.status(500).json({ message: "Failed to update shop" });
    }
  });

  // Get shop by ID (public)
  app.get("/api/shops/:id", async (req, res) => {
    try {
      const shop = await storage.getShop(req.params.id);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      console.error("Error fetching shop:", error);
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });

  // ============ PRODUCTS ============

  // Get all products (admin catalog)
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { search, type, flavor } = req.query;
      const products = await storage.getProducts({
        search: search as string,
        type: type as string,
        flavor: flavor as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // ============ CUSTOM PRODUCTS (Shop Owner Created) ============

  // Get shop's custom products
  app.get("/api/shops/:shopId/custom-products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      const { search, type, flavor } = req.query;
      
      const shop = await storage.getShop(shopId);
      if (!shop || shop.shopOwnerId !== shopOwnerId) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const products = await storage.getShopCustomProducts(shopId, {
        search: search as string,
        type: type as string,
        flavor: flavor as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching custom products:", error);
      res.status(500).json({ message: "Failed to fetch custom products" });
    }
  });

  // Create custom product for shop
  app.post("/api/shops/:shopId/custom-products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      
      const shop = await storage.getShop(shopId);
      if (!shop || shop.shopOwnerId !== shopOwnerId) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const schema = z.object({
        productName: z.string().min(1, "Product name is required"),
        productType: z.string().min(1, "Product type is required"),
        flavorCategory: z.string().optional(),
        flavorDescription: z.string().optional(),
        nicotineType: z.string().optional(),
        imageUrl: z.string().optional(),
        brandId: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      const product = await storage.createProduct({
        ...validated,
        isCustom: true,
        createdByShopId: shopId,
      });

      await storage.addProductToShop({
        shopId,
        productId: product.id,
        isActive: true,
      });

      const fullProduct = await storage.getProduct(product.id);
      res.status(201).json(fullProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating custom product:", error);
      res.status(500).json({ message: "Failed to create custom product" });
    }
  });

  // Update custom product
  app.patch("/api/shops/:shopId/custom-products/:productId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId, productId } = req.params;
      
      const shop = await storage.getShop(shopId);
      if (!shop || shop.shopOwnerId !== shopOwnerId) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const product = await storage.getProduct(productId);
      if (!product || product.createdByShopId !== shopId) {
        return res.status(404).json({ message: "Custom product not found" });
      }

      const schema = z.object({
        productName: z.string().min(1).optional(),
        productType: z.string().optional(),
        flavorCategory: z.string().optional(),
        flavorDescription: z.string().optional(),
        nicotineType: z.string().optional(),
        imageUrl: z.string().optional(),
        brandId: z.string().optional(),
      });

      const validated = schema.parse(req.body);
      const updated = await storage.updateProduct(productId, validated);
      const fullProduct = await storage.getProduct(productId);
      res.json(fullProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating custom product:", error);
      res.status(500).json({ message: "Failed to update custom product" });
    }
  });

  // Delete custom product
  app.delete("/api/shops/:shopId/custom-products/:productId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId, productId } = req.params;
      
      const shop = await storage.getShop(shopId);
      if (!shop || shop.shopOwnerId !== shopOwnerId) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const product = await storage.getProduct(productId);
      if (!product || product.createdByShopId !== shopId) {
        return res.status(404).json({ message: "Custom product not found" });
      }

      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom product:", error);
      res.status(500).json({ message: "Failed to delete custom product" });
    }
  });

  // ============ SHOP PRODUCTS (Menu Management) ============

  // Helper to verify shop ownership
  async function verifyShopOwnership(shopId: string, shopOwnerId: string): Promise<boolean> {
    const shop = await storage.getShop(shopId);
    return shop?.shopOwnerId === shopOwnerId;
  }

  // Get specific shop's products (multi-shop support)
  app.get("/api/shops/:shopId/products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      
      if (!(await verifyShopOwnership(shopId, shopOwnerId))) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const products = await storage.getShopProducts(shopId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching shop products:", error);
      res.status(500).json({ message: "Failed to fetch shop products" });
    }
  });

  // Add product to specific shop menu
  app.post("/api/shops/:shopId/products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      
      if (!(await verifyShopOwnership(shopId, shopOwnerId))) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID required" });
      }

      const exists = await storage.isProductInShop(shopId, productId);
      if (exists) {
        return res.status(400).json({ message: "Product already in menu" });
      }

      const shopProduct = await storage.addProductToShop({
        shopId,
        productId,
        isActive: true,
      });

      res.status(201).json(shopProduct);
    } catch (error) {
      console.error("Error adding product to shop:", error);
      res.status(500).json({ message: "Failed to add product to menu" });
    }
  });

  // Update shop product
  app.patch("/api/shops/:shopId/products/:id", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      
      if (!(await verifyShopOwnership(shopId, shopOwnerId))) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const updated = await storage.updateShopProduct(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating shop product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Remove product from shop menu
  app.delete("/api/shops/:shopId/products/:productId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId, productId } = req.params;
      
      if (!(await verifyShopOwnership(shopId, shopOwnerId))) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      await storage.removeProductFromShop(shopId, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing product from shop:", error);
      res.status(500).json({ message: "Failed to remove product from menu" });
    }
  });

  // Reorder shop products
  app.put("/api/shops/:shopId/products/reorder", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      
      if (!(await verifyShopOwnership(shopId, shopOwnerId))) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const { productIds } = req.body;
      if (!Array.isArray(productIds)) {
        return res.status(400).json({ message: "Product IDs array required" });
      }

      await storage.reorderShopProducts(shopId, productIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error reordering products:", error);
      res.status(500).json({ message: "Failed to reorder products" });
    }
  });

  // Update specific shop (multi-shop support)
  app.patch("/api/shops/:shopId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const { shopId } = req.params;
      
      if (!(await verifyShopOwnership(shopId, shopOwnerId))) {
        return res.status(403).json({ message: "Not authorized to access this shop" });
      }

      const updatedShop = await storage.updateShop(shopId, req.body);
      res.json(updatedShop);
    } catch (error) {
      console.error("Error updating shop:", error);
      res.status(500).json({ message: "Failed to update shop" });
    }
  });

  // ============ LEGACY ENDPOINTS (Backward compatibility) ============

  // Get current shop's products (legacy - uses first shop)
  app.get("/api/shops/my/products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const products = await storage.getShopProducts(shop.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching shop products:", error);
      res.status(500).json({ message: "Failed to fetch shop products" });
    }
  });

  // Add product to shop menu (legacy)
  app.post("/api/shops/my/products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID required" });
      }

      const exists = await storage.isProductInShop(shop.id, productId);
      if (exists) {
        return res.status(400).json({ message: "Product already in menu" });
      }

      const shopProduct = await storage.addProductToShop({
        shopId: shop.id,
        productId,
        isActive: true,
      });

      res.status(201).json(shopProduct);
    } catch (error) {
      console.error("Error adding product to shop:", error);
      res.status(500).json({ message: "Failed to add product to menu" });
    }
  });

  // Update shop product (legacy)
  app.patch("/api/shops/my/products/:id", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const updated = await storage.updateShopProduct(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating shop product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Remove product from shop menu (legacy)
  app.delete("/api/shops/my/products/:productId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      await storage.removeProductFromShop(shop.id, req.params.productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing product from shop:", error);
      res.status(500).json({ message: "Failed to remove product from menu" });
    }
  });

  // Reorder shop products (legacy)
  app.put("/api/shops/my/products/reorder", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const { productIds } = req.body;
      if (!Array.isArray(productIds)) {
        return res.status(400).json({ message: "Product IDs array required" });
      }

      await storage.reorderShopProducts(shop.id, productIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error reordering products:", error);
      res.status(500).json({ message: "Failed to reorder products" });
    }
  });

  // ============ PUBLIC MENU ============

  // Get shop's public menu
  app.get("/api/shops/:shopId/menu", async (req, res) => {
    try {
      const { search, type, flavor, nicotineType, limit } = req.query;
      const products = await storage.getShopMenuProducts(req.params.shopId, {
        search: search as string,
        type: type as string,
        flavor: flavor as string,
        nicotineType: nicotineType as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // ============ CUSTOMER FAVORITES ============

  // Get customer favorites
  app.get("/api/customers/favorites/:shopId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const customerId = req.userId!;
      const favorites = await storage.getCustomerFavorites(customerId, req.params.shopId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Add favorite
  app.post("/api/customers/favorites", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const customerId = req.userId!;
      const { productId, shopId } = req.body;

      if (!productId || !shopId) {
        return res.status(400).json({ message: "Product ID and Shop ID required" });
      }

      const exists = await storage.isFavorite(customerId, productId, shopId);
      if (exists) {
        return res.status(400).json({ message: "Already favorited" });
      }

      const favorite = await storage.addFavorite({
        customerId,
        productId,
        shopId,
      });

      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  // Remove favorite
  app.delete("/api/customers/favorites/:productId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const customerId = req.userId!;
      const { shopId } = req.query;

      if (!shopId) {
        return res.status(400).json({ message: "Shop ID required" });
      }

      await storage.removeFavorite(customerId, req.params.productId, shopId as string);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // ============ SESSIONS (Kiosk/Guest Mode) ============

  // Create guest session
  app.post("/api/sessions/guest", async (req, res) => {
    try {
      const schema = z.object({
        shopId: z.string().min(1, "Shop ID required"),
      });

      const validated = schema.parse(req.body);
      const shop = await storage.getShop(validated.shopId);
      
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const timeoutMinutes = shop.kioskTimeoutMinutes || 5;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

      const sessionData = insertKioskSessionSchema.parse({
        userId: null,
        shopId: validated.shopId,
        mode: "guest",
        expiresAt,
        ipAddress: req.ip || null,
        userAgent: req.get('user-agent')?.substring(0, 500) || null,
      });

      const session = await storage.createKioskSession(sessionData);
      res.json(session);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating guest session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Clear all sessions for a shop (staff reset)
  app.post("/api/sessions/clear", async (req, res) => {
    try {
      const schema = z.object({
        shopId: z.string().min(1, "Shop ID required"),
      });

      const validated = schema.parse(req.body);
      await storage.clearShopKioskSessions(validated.shopId);
      res.json({ message: "Sessions cleared" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error clearing sessions:", error);
      res.status(500).json({ message: "Failed to clear sessions" });
    }
  });

  // Update session activity (heartbeat)
  app.post("/api/sessions/heartbeat", async (req, res) => {
    try {
      const schema = z.object({
        sessionId: z.string().min(1, "Session ID required"),
      });

      const validated = schema.parse(req.body);
      const session = await storage.getKioskSession(validated.sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (new Date() > new Date(session.expiresAt)) {
        await storage.deleteKioskSession(validated.sessionId);
        return res.status(410).json({ message: "Session expired" });
      }

      const updated = await storage.updateKioskSessionActivity(validated.sessionId);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Delete a specific session
  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      await storage.deleteKioskSession(sessionId);
      res.json({ message: "Session deleted" });
    } catch (error: any) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Cleanup expired sessions
  app.post("/api/sessions/cleanup", async (req, res) => {
    try {
      await storage.cleanupExpiredKioskSessions();
      res.json({ message: "Cleanup complete" });
    } catch (error: any) {
      console.error("Error cleaning up sessions:", error);
      res.status(500).json({ message: "Failed to cleanup sessions" });
    }
  });

  // ============ AUTH ============
  
  // Get current user (for frontend auth state)
  app.get("/api/auth/user", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      res.json({
        id: req.userId,
        email: req.userEmail,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check if current user is a shop owner
  app.get("/api/auth/is-shop-owner", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const shopOwnerId = req.userId!;
      const shop = await storage.getShopByOwnerId(shopOwnerId);
      res.json({ isShopOwner: !!shop });
    } catch (error) {
      console.error("Error checking shop owner:", error);
      res.status(500).json({ message: "Failed to check shop owner status" });
    }
  });

  // ============ CUSTOMER PROFILE & AGE VERIFICATION ============

  // Check if customer exists by email (public - used before OTP)
  app.post("/api/customers/check-email", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email("Invalid email address"),
      });

      const { email } = schema.parse(req.body);
      
      const customer = await db.query.customers.findFirst({
        where: eq(customers.email, email.toLowerCase()),
      });

      res.json({ exists: !!customer });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error checking customer email:", error);
      res.status(500).json({ message: "Failed to check email" });
    }
  });

  // Get current customer profile
  app.get("/api/customers/me", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      
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
  app.post("/api/customers/verify-age", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const userEmail = req.userEmail;
      
      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const schema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").refine((dob) => {
          const parts = dob.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          
          // Validate year range
          if (year < 1900 || year > new Date().getFullYear()) return false;
          // Validate month
          if (month < 1 || month > 12) return false;
          // Validate day
          if (day < 1 || day > 31) return false;
          
          // Check if it's a valid date
          const date = new Date(year, month - 1, day);
          return date.getFullYear() === year && 
                 date.getMonth() === month - 1 && 
                 date.getDate() === day;
        }, "Invalid date"),
      });

      const validated = schema.parse(req.body);

      // Parse and validate the date
      const parts = validated.dateOfBirth.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const birthDate = new Date(year, month, day);
      
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

  // ============ KIOSK ADMIN ACCESS ============

  // Verify shop owner for kiosk admin access
  app.post("/api/kiosk/admin-access", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email("Invalid email format"),
        shopId: z.string().min(1, "Shop ID is required"),
      });

      const { email, shopId } = schema.parse(req.body);

      console.log(`Admin access attempt: ${email} for shop ${shopId} from IP ${req.ip}`);

      // Query: Check if this email belongs to the owner of THIS specific shop
      // Uses INNER JOIN to ensure BOTH conditions are true
      const result = await db
        .select({
          shopOwnerId: shopOwners.id,
          shopOwnerEmail: shopOwners.email,
          shopId: shops.id,
          shopName: shops.shopName,
        })
        .from(shopOwners)
        .innerJoin(shops, eq(shops.shopOwnerId, shopOwners.id))
        .where(
          and(
            eq(shopOwners.email, email),
            eq(shops.id, shopId)
          )
        )
        .limit(1);

      if (result.length === 0) {
        console.log(`Admin access DENIED: ${email} for shop ${shopId} - not authorized`);
        return res.status(403).json({ 
          message: "Email not authorized for this shop" 
        });
      }

      const shopOwner = result[0];
      console.log(`Admin access GRANTED: ${email} for shop ${shopId} (${shopOwner.shopName})`);

      res.json({ 
        authorized: true, 
        email: shopOwner.shopOwnerEmail,
        shopName: shopOwner.shopName,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: error.errors[0].message 
        });
      }
      console.error("Error verifying admin access:", error);
      res.status(500).json({ message: "Failed to verify admin access" });
    }
  });

  return httpServer;
}
