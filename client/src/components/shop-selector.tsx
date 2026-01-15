import { useShop } from "@/contexts/shop-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Plus, Check } from "lucide-react";
import { useLocation } from "wouter";

export function ShopSelector() {
  const { currentShop, allShops, setCurrentShop, isLoading } = useShop();
  const [, setLocation] = useLocation();

  const handleCreateShop = () => {
    setLocation("/admin/create-shop");
  };

  if (isLoading || !currentShop) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Building2 className="w-4 h-4" />
        <span className="text-muted-foreground">Loading...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-shop-selector">
          <Building2 className="w-4 h-4" />
          <span className="max-w-[150px] truncate">{currentShop.shopName}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your Shops</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {allShops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => setCurrentShop(shop)}
            className={currentShop.id === shop.id ? "bg-accent" : ""}
            data-testid={`menu-item-shop-${shop.id}`}
          >
            <Building2 className="w-4 h-4 mr-2" />
            <span className="truncate flex-1">{shop.shopName}</span>
            {currentShop.id === shop.id && (
              <Check className="w-4 h-4 ml-2 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateShop} data-testid="menu-item-create-shop">
          <Plus className="w-4 h-4 mr-2" />
          Create New Shop
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
