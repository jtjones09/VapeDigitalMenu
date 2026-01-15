import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  GripVertical,
  Package,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useShop } from "@/contexts/shop-context";
import type { ShopProductWithDetails } from "@shared/schema";
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

export default function MyMenu() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const { currentShop: shop } = useShop();

  const { data: menuProducts, isLoading } = useQuery<ShopProductWithDetails[]>({
    queryKey: ["/api/shops", shop?.id, "products"],
    enabled: !!shop,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/shops/${shop?.id}/products/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops", shop?.id, "products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/shops/${shop?.id}/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops", shop?.id, "products"] });
      toast({
        title: "Product removed",
        description: "The product has been removed from your menu.",
      });
      setDeleteProductId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove product",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      await apiRequest("PUT", `/api/shops/${shop?.id}/products/reorder`, { productIds });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder products",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex || !menuProducts) return;

    const newProducts = [...menuProducts];
    const [removed] = newProducts.splice(dragIndex, 1);
    newProducts.splice(dropIndex, 0, removed);

    queryClient.setQueryData(["/api/shops", shop?.id, "products"], newProducts);
    reorderMutation.mutate(newProducts.map((p) => p.productId));
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

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-my-menu-title">My Menu</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your digital menu
            </p>
          </div>
          <Button asChild data-testid="button-add-products">
            <Link href="/admin/products">
              <Plus className="w-4 h-4 mr-2" />
              Add Products
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-6 h-6" />
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </Card>
            ))}
          </div>
        ) : menuProducts?.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your menu is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding products from our catalog to create your menu
            </p>
            <Button asChild data-testid="button-browse-catalog">
              <Link href="/admin/products">
                Browse Catalog <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {menuProducts?.map((item, index) => (
              <Card
                key={item.id}
                className={`p-4 transition-opacity ${!item.isActive ? "opacity-60" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                data-testid={`menu-item-${item.productId}`}
              >
                <div className="flex items-center gap-4">
                  <button
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
                    data-testid={`drag-handle-${item.productId}`}
                  >
                    <GripVertical className="w-5 h-5" />
                  </button>
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.product?.brand && (
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {item.product.brand.brandName}
                      </p>
                    )}
                    <h3 className="font-semibold truncate" data-testid={`text-menu-product-${item.productId}`}>
                      {item.product?.productName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground capitalize">
                        {item.product?.productType}
                      </span>
                      {item.product?.flavorCategory && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${flavorColors[item.product.flavorCategory] || flavorColors.other}`}
                        >
                          {item.product.flavorCategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {item.isActive ? (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={item.isActive ?? false}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: item.id, isActive: checked })
                        }
                        data-testid={`switch-active-${item.productId}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteProductId(item.productId)}
                      data-testid={`button-delete-${item.productId}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from menu?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be removed from your menu. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && removeProductMutation.mutate(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
