import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { 
  Cherry, 
  Cake, 
  Candy, 
  Snowflake, 
  Cigarette, 
  Coffee,
  Grid3X3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlavorCategoryGridProps {
  shopId: string;
  nicotineType: string;
  isKioskMode: boolean;
}

const flavorCategories = [
  { id: "fruit", label: "Fruit", icon: Cherry, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10" },
  { id: "dessert", label: "Dessert", icon: Cake, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-500/10" },
  { id: "candy", label: "Candy", icon: Candy, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/10" },
  { id: "menthol", label: "Menthol", icon: Snowflake, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/10" },
  { id: "tobacco", label: "Tobacco", icon: Cigarette, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  { id: "beverage", label: "Beverage", icon: Coffee, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" },
  { id: "all", label: "All Flavors", icon: Grid3X3, color: "text-foreground", bg: "bg-muted" },
];

export function FlavorCategoryGrid({ shopId, nicotineType, isKioskMode }: FlavorCategoryGridProps) {
  const modeParam = isKioskMode ? "?mode=kiosk" : "";
  const nicotineLabel = nicotineType === "regular" ? "Regular Nicotine" : nicotineType === "salt" ? "Salt Nicotine" : "All Products";
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-flavor-title">Choose a Flavor Category</h2>
        <p className="text-muted-foreground">
          Browsing {nicotineLabel} E-Liquids
        </p>
      </div>
      
      <div className={cn(
        "grid gap-4",
        isKioskMode 
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      )}>
        {flavorCategories.map((category) => {
          const Icon = category.icon;
          const href = category.id === "all" 
            ? `/menu/${shopId}/${nicotineType}${modeParam}`
            : `/menu/${shopId}/${nicotineType}/${category.id}${modeParam}`;
          
          return (
            <Link key={category.id} href={href}>
              <Card 
                className={cn(
                  "group hover-elevate cursor-pointer transition-all",
                  isKioskMode ? "min-h-[140px]" : "min-h-[100px]"
                )}
                data-testid={`card-flavor-${category.id}`}
              >
                <div className={cn(
                  "h-full flex flex-col items-center justify-center p-4",
                  category.bg
                )}>
                  <div className={cn(
                    "rounded-full flex items-center justify-center mb-3",
                    isKioskMode ? "w-14 h-14" : "w-12 h-12"
                  )}>
                    <Icon className={cn(
                      category.color,
                      isKioskMode ? "w-8 h-8" : "w-6 h-6"
                    )} />
                  </div>
                  <span className={cn(
                    "font-semibold text-center",
                    isKioskMode ? "text-lg" : "text-sm"
                  )}>
                    {category.label}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
