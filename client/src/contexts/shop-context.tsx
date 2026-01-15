import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import type { Shop } from "@shared/schema";

interface ShopContextType {
  currentShop: Shop | null;
  allShops: Shop[];
  setCurrentShop: (shop: Shop) => void;
  isLoading: boolean;
  refetchShops: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);

  const { data: allShops = [], isLoading, refetch } = useQuery<Shop[]>({
    queryKey: ["/api/shops/list"],
    queryFn: async () => {
      const res = await fetch("/api/shops/list", {
        headers: await getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (allShops.length > 0) {
      const savedShopId = localStorage.getItem("selectedShopId");
      
      if (savedShopId) {
        const savedShop = allShops.find(s => s.id === savedShopId);
        if (savedShop) {
          setCurrentShopState(savedShop);
          return;
        }
      }
      
      if (!currentShop) {
        setCurrentShopState(allShops[0]);
      } else {
        const stillExists = allShops.find(s => s.id === currentShop.id);
        if (!stillExists) {
          setCurrentShopState(allShops[0]);
          localStorage.setItem("selectedShopId", allShops[0].id);
        } else if (stillExists.shopName !== currentShop.shopName) {
          setCurrentShopState(stillExists);
        }
      }
    }
  }, [allShops]);

  const setCurrentShop = (shop: Shop) => {
    setCurrentShopState(shop);
    localStorage.setItem("selectedShopId", shop.id);
  };

  return (
    <ShopContext.Provider value={{ 
      currentShop, 
      allShops, 
      setCurrentShop, 
      isLoading,
      refetchShops: refetch,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}
