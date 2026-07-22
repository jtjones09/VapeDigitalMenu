import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, Check, ExternalLink } from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";
import type { ProductWithBrand, ProductVariant } from "@shared/schema";

interface ProductDetailSheetProps {
  productId: string | null;
  isInMenu: boolean;
  isPending: boolean;
  onAddToMenu: (productId: string) => void;
  onRemoveFromMenu: (productId: string) => void;
  onClose: () => void;
}

const flavorColors: Record<string, string> = {
  fruit: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  dessert: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  menthol: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  tobacco: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  beverage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  candy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function VariantsTable({ variants }: { variants: ProductVariant[] }) {
  if (variants.length === 0) {
    return <p className="text-sm text-muted-foreground">No variants listed.</p>;
  }
  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-variants">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Nicotine</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">VG/PG</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Size</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">SKU</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">MSRP</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => (
            <tr
              key={v.id}
              className={i < variants.length - 1 ? "border-b" : ""}
              data-testid={`row-variant-${v.id}`}
            >
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{v.nicotineLevel ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{v.vgPgRatio ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{v.bottleSize ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{v.sku ?? "—"}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {v.msrp ? <span className="font-medium">${Number(v.msrp).toFixed(2)}</span> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductBody({
  product,
  isInMenu,
  isPending,
  onAddToMenu,
  onRemoveFromMenu,
}: {
  product: ProductWithBrand;
  isInMenu: boolean;
  isPending: boolean;
  onAddToMenu: (id: string) => void;
  onRemoveFromMenu: (id: string) => void;
}) {
  const globalVariants = product.variants.filter((v) => v.isGlobal !== false);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="w-full h-full object-cover"
              data-testid="img-product-detail"
            />
          ) : (
            <Package className="w-16 h-16 text-muted-foreground" />
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

        <div className="p-6 space-y-5">
          <SheetHeader>
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {product.brand.brandName}
              </p>
            )}
            <SheetTitle className="text-xl leading-snug" data-testid="text-detail-product-name">
              {product.productName}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Product details for {product.productName}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{product.productType}</Badge>
            {product.nicotineType && (
              <Badge variant="outline" className="capitalize">{product.nicotineType} nicotine</Badge>
            )}
          </div>

          {product.flavorDescription && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Flavor Profile</h4>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-flavor-description">
                {product.flavorDescription}
              </p>
            </div>
          )}

          {product.brand?.website && (
            <a
              href={product.brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-brand-website"
            >
              <ExternalLink className="w-3 h-3" />
              {product.brand.website.replace(/^https?:\/\//, "")}
            </a>
          )}

          <hr className="border-border" />

          <div>
            <h4 className="text-sm font-semibold mb-3">
              Variants
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({globalVariants.length})
              </span>
            </h4>
            <VariantsTable variants={globalVariants} />
          </div>
        </div>
      </div>

      <div className="border-t p-4 bg-background shrink-0">
        {isInMenu ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>Already in your menu</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveFromMenu(product.id)}
              disabled={isPending}
              data-testid="button-remove-from-menu"
            >
              Remove
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => onAddToMenu(product.id)}
            disabled={isPending}
            data-testid="button-add-to-menu"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to My Menu
          </Button>
        )}
      </div>
    </>
  );
}

export function ProductDetailSheet({
  productId,
  isInMenu,
  isPending,
  onAddToMenu,
  onRemoveFromMenu,
  onClose,
}: ProductDetailSheetProps) {
  const { data: product, isLoading } = useQuery<ProductWithBrand>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/products/${productId}`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("Failed to load product");
      return res.json();
    },
    enabled: !!productId,
  });

  return (
    <Sheet open={!!productId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-full">
        {isLoading || !product ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ProductBody
            product={product}
            isInMenu={isInMenu}
            isPending={isPending}
            onAddToMenu={onAddToMenu}
            onRemoveFromMenu={onRemoveFromMenu}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
