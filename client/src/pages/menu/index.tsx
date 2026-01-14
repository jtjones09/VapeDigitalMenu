import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Heart,
  Package,
  Filter,
  QrCode,
  Tablet,
  LogIn,
  User,
  Lock,
  Timer,
  Home,
} from "lucide-react";
import type { Shop, ProductWithBrand, CustomerFavorite } from "@shared/schema";

const flavorCategories = ["all", "fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other"];
const productTypes = ["all", "e-liquid", "disposable", "hardware", "accessory"];

export default function Menu() {
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearch();
  const isKioskMode = new URLSearchParams(searchParams).get("mode") === "kiosk";
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flavorFilter, setFlavorFilter] = useState("all");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["/api/shops", params.shopId],
    enabled: !!params.shopId,
  });

  const buildMenuQueryKey = () => {
    const params_arr = new URLSearchParams();
    if (search) params_arr.set("search", search);
    if (typeFilter !== "all") params_arr.set("type", typeFilter);
    if (flavorFilter !== "all") params_arr.set("flavor", flavorFilter);
    const queryString = params_arr.toString();
    return [`/api/shops/${params.shopId}/menu${queryString ? `?${queryString}` : ""}`];
  };

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithBrand[]>({
    queryKey: buildMenuQueryKey(),
    enabled: !!params.shopId,
  });

  const { data: favorites } = useQuery<CustomerFavorite[]>({
    queryKey: ["/api/customers/favorites", params.shopId],
    enabled: isAuthenticated && !!params.shopId,
  });

  const favoriteIds = new Set(favorites?.map(f => f.productId) || []);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/customers/favorites/${productId}?shopId=${params.shopId}`);
      } else {
        await apiRequest("POST", "/api/customers/favorites", { productId, shopId: params.shopId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/favorites", params.shopId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    if (!isKioskMode || !shop?.kioskTimeoutMinutes) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetActivity));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [isKioskMode, shop?.kioskTimeoutMinutes, resetActivity]);

  useEffect(() => {
    if (!isKioskMode || !shop?.kioskTimeoutMinutes) return;

    const interval = setInterval(() => {
      const timeoutMs = (shop.kioskTimeoutMinutes || 5) * 60 * 1000;
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, timeoutMs - elapsed);
      setRemainingTime(remaining);

      if (remaining === 0 && isAuthenticated) {
        signOut().then(() => setLocation("/"));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isKioskMode, shop?.kioskTimeoutMinutes, lastActivity, isAuthenticated]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const flavorColors: Record<string, string> = {
    fruit: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    dessert: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    menthol: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    tobacco: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    beverage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    candy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Menu Not Found</h1>
          <p className="text-muted-foreground">
            This menu doesn't exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-home">
              <Link href="/">
                <Home className="w-5 h-5" />
              </Link>
            </Button>
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.shopName} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-lg leading-tight" data-testid="text-shop-name">{shop.shopName}</h1>
              {isKioskMode && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tablet className="w-3 h-3" />
                  <span>Kiosk Mode</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authLoading ? (
              <Skeleton className="w-9 h-9 rounded-full" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild data-testid="button-login">
                <a href="/api/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
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
                  <SelectTrigger className="w-[140px]" data-testid="select-type">
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
                  <SelectTrigger className="w-[140px]" data-testid="select-flavor">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products?.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {search || typeFilter !== "all" || flavorFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "This menu is currently empty"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products?.map((product) => {
                const isFavorite = favoriteIds.has(product.id);
                return (
                  <Link key={product.id} href={`/menu/${params.shopId}/product/${product.id}${isKioskMode ? "?mode=kiosk" : ""}`}>
                    <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-product-${product.id}`}>
                      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-muted-foreground" />
                        )}
                        {product.flavorCategory && (
                          <Badge
                            variant="secondary"
                            className={`absolute top-2 left-2 text-xs ${flavorColors[product.flavorCategory] || flavorColors.other}`}
                          >
                            {product.flavorCategory}
                          </Badge>
                        )}
                        {isAuthenticated && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavoriteMutation.mutate({ productId: product.id, isFavorite });
                            }}
                            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover-elevate"
                            data-testid={`button-favorite-${product.id}`}
                          >
                            <Heart
                              className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                            />
                          </button>
                        )}
                      </div>
                      <CardContent className="p-3 space-y-1">
                        {product.brand && (
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
                            {product.brand.brandName}
                          </p>
                        )}
                        <h3 className="font-semibold text-sm line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                          {product.productName}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {product.productType}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {isKioskMode && (
        <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="w-4 h-4" />
              {remainingTime !== null && (
                <span>Auto-logout in: {formatTime(remainingTime)}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              data-testid="button-staff-reset"
            >
              <Lock className="w-4 h-4 mr-2" />
              Staff Reset
            </Button>
          </div>
        </footer>
      )}

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out Current Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the session and return to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                await signOut();
                setLocation("/");
              }}
              data-testid="button-confirm-reset"
            >
              Yes, Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
