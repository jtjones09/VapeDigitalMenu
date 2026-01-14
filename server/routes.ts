import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { insertShopSchema, insertShopProductSchema, insertCustomerFavoriteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // ============ SHOPS ============
  
  // Get current user's shop
  app.get("/api/shops/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      console.error("Error fetching shop:", error);
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });

  // Create shop
  app.post("/api/shops", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const existingShop = await storage.getShopByUserId(userId);
      if (existingShop) {
        return res.status(400).json({ message: "Shop already exists" });
      }

      const data = insertShopSchema.parse({
        ...req.body,
        userId,
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

  // Update shop
  app.patch("/api/shops/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      
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

  // ============ SHOP PRODUCTS (Menu Management) ============

  // Get current shop's products
  app.get("/api/shops/my/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      
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

  // Add product to shop menu
  app.post("/api/shops/my/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      
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

  // Update shop product
  app.patch("/api/shops/my/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      
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

  // Remove product from shop menu
  app.delete("/api/shops/my/products/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      
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

  // Reorder shop products
  app.put("/api/shops/my/products/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shop = await storage.getShopByUserId(userId);
      
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
      const { search, type, flavor } = req.query;
      const products = await storage.getShopMenuProducts(req.params.shopId, {
        search: search as string,
        type: type as string,
        flavor: flavor as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // ============ CUSTOMER FAVORITES ============

  // Get customer favorites
  app.get("/api/customers/favorites/:shopId", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user.claims.sub;
      const favorites = await storage.getCustomerFavorites(customerId, req.params.shopId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Add favorite
  app.post("/api/customers/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user.claims.sub;
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
  app.delete("/api/customers/favorites/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user.claims.sub;
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

  return httpServer;
}
