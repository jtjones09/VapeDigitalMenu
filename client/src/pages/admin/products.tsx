import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Check, Package, Filter } from "lucide-react";
import type { Product, ProductWithBrand, Shop, ShopProduct } from "@shared/schema";

const productTypes = ["all", "e-liquid", "disposable", "hardware", "accessory"];
const flavorCategories = ["all", "fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other"];

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flavorFilter, setFlavorFilter] = useState("all");

  const { data: shop } = useQuery<Shop>({
    queryKey: ["/api/shops/my"],
  });

  const buildProductsQueryKey = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (flavorFilter !== "all") params.set("flavor", flavorFilter);
    const queryString = params.toString();
    return [`/api/products${queryString ? `?${queryString}` : ""}`];
  };

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithBrand[]>({
    queryKey: buildProductsQueryKey(),
  });

  const { data: myProducts } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shops/my/products"],
    enabled: !!shop,
  });

  const myProductIds = new Set(myProducts?.map(p => p.productId) || []);

  const addToMenuMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/shops/my/products", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops/my/products"] });
      toast({
        title: "Product added",
        description: "The product has been added to your menu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const removeFromMenuMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/shops/my/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops/my/products"] });
      toast({
        title: "Product removed",
        description: "The product has been removed from your menu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove product",
        variant: "destructive",
      });
    },
  });

  const flavorColors: Record<string, string> = {
    fruit: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    dessert: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    menthol: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    tobacco: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    beverage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    candy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-products-title">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse products and add them to your menu
          </p>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-type">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={flavorFilter} onValueChange={setFlavorFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-flavor">
                  <SelectValue placeholder="Flavor" />
                </SelectTrigger>
                <SelectContent>
                  {flavorCategories.map((flavor) => (
                    <SelectItem key={flavor} value={flavor}>
                      {flavor === "all" ? "All Flavors" : flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {productsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products?.map((product) => {
              const inMenu = myProductIds.has(product.id);
              return (
                <Card key={product.id} className="overflow-hidden hover-elevate" data-testid={`card-product-${product.id}`}>
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                    {product.flavorCategory && (
                      <Badge
                        variant="secondary"
                        className={`absolute top-3 left-3 ${flavorColors[product.flavorCategory] || flavorColors.other}`}
                      >
                        {product.flavorCategory}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          {product.brand.brandName}
                        </p>
                      )}
                      <h3 className="font-semibold line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                        {product.productName}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {product.productType}
                      </p>
                    </div>
                    <Button
                      variant={inMenu ? "secondary" : "default"}
                      className="w-full"
                      onClick={() => {
                        if (inMenu) {
                          removeFromMenuMutation.mutate(product.id);
                        } else {
                          addToMenuMutation.mutate(product.id);
                        }
                      }}
                      disabled={addToMenuMutation.isPending || removeFromMenuMutation.isPending}
                      data-testid={`button-toggle-${product.id}`}
                    >
                      {inMenu ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          In Menu
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Menu
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
