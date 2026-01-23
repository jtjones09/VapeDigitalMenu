import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Heart,
  Package,
  Droplets,
  Beaker,
  Scale,
  QrCode,
  Tablet,
  RotateCcw,
} from "lucide-react";
import type { Shop, ProductWithBrand, CustomerFavorite } from "@shared/schema";

export default function ProductDetail() {
  const [currentPath] = useLocation();
  const isKioskMode = currentPath.startsWith('/menu/kiosk/');
  
  // Parse route params directly from the path instead of useParams
  // This ensures we always get the current values when the URL changes
  const parsePathParams = (path: string) => {
    const cleanPath = path.split('?')[0];
    const basePath = isKioskMode ? '/menu/kiosk/' : '/menu/';
    const relativePath = cleanPath.startsWith(basePath) ? cleanPath.slice(basePath.length) : cleanPath;
    const segments = relativePath.split('/').filter(Boolean);
    
    // Route is: /:shopId/product/:productId
    return {
      shopId: segments[0] || '',
      productId: segments[2] || '', // segments[1] is "product"
    };
  };
  
  const params = parsePathParams(currentPath);
  
  // Helper to build URLs that preserve kiosk mode
  const buildUrl = (path: string) => {
    const base = isKioskMode ? '/menu/kiosk' : '/menu';
    return `${base}${path}`;
  };
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["/api/shops", params.shopId],
    enabled: !!params.shopId,
  });

  const { data: product, isLoading: productLoading } = useQuery<ProductWithBrand>({
    queryKey: ["/api/products", params.productId],
    enabled: !!params.productId,
  });

  const { data: favorites } = useQuery<CustomerFavorite[]>({
    queryKey: ["/api/customers/favorites", params.shopId],
    enabled: isAuthenticated && !!params.shopId,
  });

  const isFavorite = favorites?.some(f => f.productId === params.productId) || false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/customers/favorites/${params.productId}?shopId=${params.shopId}`);
      } else {
        await apiRequest("POST", "/api/customers/favorites", { productId: params.productId, shopId: params.shopId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/favorites", params.shopId] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite ? "Product removed from your favorites" : "Product saved to your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
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

  const menuUrl = buildUrl(`/${params.shopId}`);

  if (shopLoading || productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!shop || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This product doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href={menuUrl}>Back to Menu</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => window.history.back()}
              className="gap-1"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.shopName} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <span className="font-medium text-sm" data-testid="text-shop-name">{shop.shopName}</span>
              {isKioskMode && (
                <Badge variant="secondary" className="gap-1">
                  <Tablet className="w-3 h-3" />
                  Kiosk
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              data-testid="button-start-over"
            >
              <Link href={menuUrl}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Start Over
              </Link>
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
                data-testid="button-favorite"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center overflow-hidden relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                  data-testid="img-product"
                />
              ) : (
                <Package className="w-20 h-20 text-muted-foreground" />
              )}
              {product.flavorCategory && (
                <Badge
                  variant="secondary"
                  className={`absolute top-4 left-4 ${flavorColors[product.flavorCategory] || flavorColors.other}`}
                >
                  {product.flavorCategory}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  {product.brand.brandName}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-product-name">
                {product.productName}
              </h1>
              <p className="text-muted-foreground capitalize mt-1">
                {product.productType}
              </p>
            </div>

            {product.flavorDescription && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground" data-testid="text-description">
                  {product.flavorDescription}
                </p>
              </div>
            )}

            {product.variants && product.variants.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-medium">Available Options</h3>
                  <div className="space-y-3">
                    {product.variants.some(v => v.nicotineLevel) && (
                      <div className="flex items-start gap-3">
                        <Droplets className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Nicotine Levels</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.from(new Set(product.variants.filter(v => v.nicotineLevel).map(v => v.nicotineLevel!))).map(level => (
                              <Badge key={level} variant="outline" className="text-xs">
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {product.variants.some(v => v.vgPgRatio) && (
                      <div className="flex items-start gap-3">
                        <Beaker className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">VG/PG Ratios</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.from(new Set(product.variants.filter(v => v.vgPgRatio).map(v => v.vgPgRatio!))).map(ratio => (
                              <Badge key={ratio} variant="outline" className="text-xs">
                                {ratio}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {product.variants.some(v => v.bottleSize) && (
                      <div className="flex items-start gap-3">
                        <Scale className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Sizes</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.from(new Set(product.variants.filter(v => v.bottleSize).map(v => v.bottleSize!))).map(size => (
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
      </main>
    </div>
  );
}
