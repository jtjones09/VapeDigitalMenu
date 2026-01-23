import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  Package,
  QrCode,
  Tablet,
  LogIn,
  User,
  Timer,
  Maximize,
  LogOut,
  Users,
  Shield,
  RotateCcw,
  Droplets,
  Beaker,
  Scale,
} from "lucide-react";
import { GuestLogin } from "@/components/guest-login";
import { CategorySelector } from "@/components/menu/category-selector";
import { FlavorCategoryGrid } from "@/components/menu/flavor-category-grid";
import { Breadcrumbs } from "@/components/menu/breadcrumbs";
import { SearchBar } from "@/components/menu/search-bar";
import type { Shop, ProductWithBrand, CustomerFavorite } from "@shared/schema";

const validNicotineTypes = ["regular", "salt", "all"];
const validFlavorCategories = ["fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other", "all"];

export default function Menu() {
  const [currentPath] = useLocation();
  const isKioskMode = currentPath.startsWith('/menu/kiosk/');
  
  // Parse route params directly from the path instead of useParams
  // This ensures we always get the current values when the URL changes
  const parsePathParams = (path: string) => {
    // Clean any query strings
    const cleanPath = path.split('?')[0];
    // Remove the base prefix
    const basePath = isKioskMode ? '/menu/kiosk/' : '/menu/';
    const relativePath = cleanPath.startsWith(basePath) ? cleanPath.slice(basePath.length) : cleanPath;
    const segments = relativePath.split('/').filter(Boolean);
    
    // Check if this is a product route: /:shopId/product/:productId
    const isProductRoute = segments[1] === 'product';
    
    return {
      shopId: segments[0] || '',
      nicotineType: isProductRoute ? undefined : segments[1],
      flavorCategory: isProductRoute ? undefined : segments[2],
      productId: isProductRoute ? segments[2] : undefined,
    };
  };
  
  const parsedParams = parsePathParams(currentPath);
  
  // Helper to build URLs that preserve kiosk mode
  const buildUrl = (path: string) => {
    const base = isKioskMode ? '/menu/kiosk' : '/menu';
    return `${base}${path}`;
  };
  
  const shopId = parsedParams.shopId;
  const rawNicotineType = parsedParams.nicotineType;
  const rawFlavorCategory = parsedParams.flavorCategory;
  const productId = parsedParams.productId;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  
  const [search, setSearch] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const nicotineType = rawNicotineType && validNicotineTypes.includes(rawNicotineType) ? rawNicotineType : undefined;
  const flavorCategory = rawFlavorCategory && validFlavorCategories.includes(rawFlavorCategory) ? rawFlavorCategory : undefined;

  const isProductDetailView = !!productId;
  const isLandingView = !nicotineType && !productId;
  const isFlavorGridView = nicotineType && !flavorCategory && nicotineType !== "all";
  const isProductListView = nicotineType && (flavorCategory || nicotineType === "all");

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["/api/shops", shopId],
    enabled: !!shopId,
  });

  const buildMenuQueryUrl = () => {
    const queryParams = new URLSearchParams();
    if (search) queryParams.set("search", search);
    if (nicotineType && nicotineType !== "all") queryParams.set("nicotineType", nicotineType);
    if (flavorCategory && flavorCategory !== "all") queryParams.set("flavor", flavorCategory);
    queryParams.set("type", "e-liquid");
    const queryString = queryParams.toString();
    return `/api/shops/${shopId}/menu${queryString ? `?${queryString}` : ""}`;
  };

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithBrand[]>({
    queryKey: ["/api/shops", shopId, "menu", { nicotineType, flavorCategory, search }],
    queryFn: async () => {
      const res = await fetch(buildMenuQueryUrl());
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!shopId && !!isProductListView,
  });

  const { data: selectedProduct, isLoading: selectedProductLoading } = useQuery<ProductWithBrand>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: favorites } = useQuery<CustomerFavorite[]>({
    queryKey: ["/api/customers/favorites", shopId],
    enabled: isAuthenticated && !!shopId,
  });

  const favoriteIds = new Set(favorites?.map(f => f.productId) || []);
  const isSelectedProductFavorite = productId ? favoriteIds.has(productId) : false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/customers/favorites/${productId}?shopId=${shopId}`);
      } else {
        await apiRequest("POST", "/api/customers/favorites", { productId, shopId: shopId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/favorites", shopId] });
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

  const handleGuestBrowse = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shopId }),
      });
      
      if (response.ok) {
        const session = await response.json();
        setSessionId(session.id);
        setIsGuestMode(true);
      }
    } catch (error) {
      console.error("Failed to create guest session:", error);
      setIsGuestMode(true);
    }
  }, [shopId]);

  const handleStaffReset = useCallback(async () => {
    setShowResetDialog(false);
    
    try {
      await fetch("/api/sessions/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shopId }),
      });
    } catch (error) {
      console.error("Failed to clear sessions:", error);
    }
    
    if (isAuthenticated) {
      await signOut();
    }
    
    setIsGuestMode(false);
    setSessionId(null);
    setSearch("");
    setLastActivity(Date.now());
    queryClient.invalidateQueries();
  }, [isAuthenticated, signOut, shopId, queryClient]);

  useEffect(() => {
    if (!isKioskMode || !sessionId) return;

    const sendHeartbeat = async () => {
      try {
        const response = await fetch("/api/sessions/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        
        if (response.status === 410) {
          setIsGuestMode(false);
          setSessionId(null);
        }
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [isKioskMode, sessionId]);

  useEffect(() => {
    if (!isKioskMode || !shop?.kioskTimeoutMinutes) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetActivity));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [isKioskMode, shop?.kioskTimeoutMinutes, resetActivity]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isKioskMode || !shop?.kioskTimeoutMinutes) return;

    const interval = setInterval(() => {
      const timeoutMs = (shop.kioskTimeoutMinutes || 5) * 60 * 1000;
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, timeoutMs - elapsed);
      setRemainingTime(remaining);

      if (remaining === 0) {
        if (sessionId) {
          fetch(`/api/sessions/${sessionId}`, {
            method: "DELETE",
          }).catch(console.error);
          setSessionId(null);
        }
        
        if (isAuthenticated) {
          signOut().then(() => {
            setIsGuestMode(false);
            setLocation(buildUrl(`/${shopId}`));
          });
        } else if (isGuestMode) {
          setIsGuestMode(false);
          setLocation(buildUrl(`/${shopId}`));
        }
        setLastActivity(Date.now());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isKioskMode, shop?.kioskTimeoutMinutes, lastActivity, isAuthenticated, isGuestMode, shopId, sessionId, signOut, setLocation]);

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

  if (isKioskMode && !isAuthenticated && !isGuestMode && !authLoading) {
    return (
      <GuestLogin
        onLoginClick={() => setLocation(`/customer-login?redirect=${encodeURIComponent(buildUrl(`/${shopId}`))}`)}
        onGuestClick={handleGuestBrowse}
        shopName={shop.shopName}
        logoUrl={shop.logoUrl}
        isKiosk={true}
        shopId={shopId}
      />
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", isKioskMode && "kiosk-mode")}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
            {nicotineType && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(buildUrl(`/${shopId}`))}
                className="gap-1"
                data-testid="button-start-over"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Start Over</span>
              </Button>
            )}
            {authLoading ? (
              <Skeleton className="w-9 h-9 rounded-full" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover-elevate cursor-pointer"
                    data-testid="button-user-menu"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      await signOut();
                      if (isKioskMode) {
                        setIsGuestMode(false);
                      }
                      setLocation(buildUrl(`/${shopId}`));
                    }}
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isGuestMode ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs" data-testid="badge-guest-mode">
                  <Users className="w-3 h-3 mr-1" />
                  Guest
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation(`/customer-login?redirect=${encodeURIComponent(buildUrl(`/${shopId}`))}`)}
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild data-testid="button-login">
                <Link href={`/customer-login?redirect=${encodeURIComponent(buildUrl(`/${shopId}`))}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
          <Card className="p-4">
            <SearchBar
              shopId={shopId}
              nicotineType={nicotineType}
              flavorCategory={flavorCategory}
              isKioskMode={isKioskMode}
              onSearchChange={setSearch}
              currentSearch={search}
            />
          </Card>

          {(!isLandingView || isProductDetailView) && (
            <Breadcrumbs
              shopId={shopId}
              nicotineType={nicotineType}
              flavorCategory={flavorCategory}
              isKioskMode={isKioskMode}
              productName={selectedProduct?.productName}
              isProductView={isProductDetailView}
            />
          )}

          {isLandingView && !isProductDetailView && (
            <CategorySelector 
              shopId={shopId} 
              isKioskMode={isKioskMode} 
            />
          )}

          {isProductDetailView && (
            <>
              {selectedProductLoading ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <Skeleton className="aspect-square rounded-xl" />
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : !selectedProduct ? (
                <Card className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
                  <p className="text-muted-foreground mb-4">
                    This product doesn't exist or has been removed.
                  </p>
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Go Back
                  </Button>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center overflow-hidden relative">
                      {selectedProduct.imageUrl ? (
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.productName}
                          className="w-full h-full object-cover"
                          data-testid="img-product"
                        />
                      ) : (
                        <Package className="w-20 h-20 text-muted-foreground" />
                      )}
                      {selectedProduct.flavorCategory && (
                        <Badge
                          variant="secondary"
                          className={`absolute top-4 left-4 ${flavorColors[selectedProduct.flavorCategory] || flavorColors.other}`}
                        >
                          {selectedProduct.flavorCategory}
                        </Badge>
                      )}
                      {isAuthenticated && (
                        <button
                          onClick={() => toggleFavoriteMutation.mutate({ 
                            productId: selectedProduct.id, 
                            isFavorite: isSelectedProductFavorite 
                          })}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover-elevate"
                          data-testid="button-favorite"
                        >
                          <Heart
                            className={`w-5 h-5 ${isSelectedProductFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      {selectedProduct.brand && (
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">
                          {selectedProduct.brand.brandName}
                        </p>
                      )}
                      <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-product-name">
                        {selectedProduct.productName}
                      </h2>
                      <p className="text-muted-foreground capitalize mt-1">
                        {selectedProduct.productType}
                      </p>
                    </div>

                    {selectedProduct.flavorDescription && (
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground" data-testid="text-description">
                          {selectedProduct.flavorDescription}
                        </p>
                      </div>
                    )}

                    {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <h3 className="font-medium">Available Options</h3>
                          <div className="space-y-3">
                            {selectedProduct.variants.some(v => v.nicotineLevel) && (
                              <div className="flex items-start gap-3">
                                <Droplets className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Nicotine Levels</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {Array.from(new Set(selectedProduct.variants.filter(v => v.nicotineLevel).map(v => v.nicotineLevel!))).map(level => (
                                      <Badge key={level} variant="outline" className="text-xs">
                                        {level}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {selectedProduct.variants.some(v => v.vgPgRatio) && (
                              <div className="flex items-start gap-3">
                                <Beaker className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">VG/PG Ratios</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {Array.from(new Set(selectedProduct.variants.filter(v => v.vgPgRatio).map(v => v.vgPgRatio!))).map(ratio => (
                                      <Badge key={ratio} variant="outline" className="text-xs">
                                        {ratio}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {selectedProduct.variants.some(v => v.bottleSize) && (
                              <div className="flex items-start gap-3">
                                <Scale className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Sizes</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {Array.from(new Set(selectedProduct.variants.filter(v => v.bottleSize).map(v => v.bottleSize!))).map(size => (
                                      <Badge key={size} variant="outline" className="text-xs">
                                        {size}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Show this to our staff to purchase
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isFlavorGridView && nicotineType && (
            <FlavorCategoryGrid 
              shopId={shopId} 
              nicotineType={nicotineType}
              isKioskMode={isKioskMode} 
            />
          )}

          {isProductListView && (
            <>
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
                  <p className="text-muted-foreground mb-4">
                    {search
                      ? "Try adjusting your search"
                      : "No products in this category"}
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={buildUrl(`/${shopId}`)}>
                      Browse All Categories
                    </Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products?.map((product) => {
                    const isFavorite = favoriteIds.has(product.id);
                    return (
                      <Link key={product.id} href={buildUrl(`/${shopId}/product/${product.id}`)}>
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
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {product.flavorCategory && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${flavorColors[product.flavorCategory] || flavorColors.other}`}
                                >
                                  {product.flavorCategory}
                                </Badge>
                              )}
                              {product.nicotineType && product.nicotineType !== "none" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-background/80 backdrop-blur"
                                >
                                  {product.nicotineType === "regular" ? "Regular" : "Salt"}
                                </Badge>
                              )}
                            </div>
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
            </>
          )}
        </div>
      </main>

      {isKioskMode && (
        <>
          <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  {remainingTime !== null && (
                    <>
                      <span className="text-lg text-muted-foreground">
                        Auto-logout in: {formatTime(remainingTime)}
                      </span>
                      <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000 rounded-full",
                            remainingTime < 60000 ? "bg-destructive" : "bg-primary"
                          )}
                          style={{ 
                            width: `${Math.min(100, (remainingTime / ((shop?.kioskTimeoutMinutes || 5) * 60 * 1000)) * 100)}%` 
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isFullscreen && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={enterFullscreen}
                    className="h-12"
                    data-testid="button-fullscreen"
                  >
                    <Maximize className="w-5 h-5 mr-2" />
                    Fullscreen
                  </Button>
                )}
              </div>
            </div>
          </footer>
          <Button
            variant="destructive"
            size="icon"
            className="fixed bottom-20 right-4 w-[60px] h-[60px] rounded-full shadow-lg"
            onClick={() => setShowResetDialog(true)}
            data-testid="button-staff-reset"
          >
            <Shield className="w-6 h-6" />
          </Button>
        </>
      )}

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset Kiosk Session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the current session and return to the welcome screen.
              Any unsaved data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStaffReset}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-reset"
            >
              Reset Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
