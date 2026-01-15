import { shopOwners, type ShopOwner, type UpsertShopOwner } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These operations are mandatory for shop owner authentication.
export interface IAuthStorage {
  getShopOwner(id: string): Promise<ShopOwner | undefined>;
  upsertShopOwner(shopOwner: UpsertShopOwner): Promise<ShopOwner>;
}

class AuthStorage implements IAuthStorage {
  async getShopOwner(id: string): Promise<ShopOwner | undefined> {
    const [owner] = await db.select().from(shopOwners).where(eq(shopOwners.id, id));
    return owner;
  }

  async upsertShopOwner(ownerData: UpsertShopOwner): Promise<ShopOwner> {
    const [owner] = await db
      .insert(shopOwners)
      .values(ownerData)
      .onConflictDoUpdate({
        target: shopOwners.id,
        set: {
          ...ownerData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return owner;
  }
}

export const authStorage = new AuthStorage();
