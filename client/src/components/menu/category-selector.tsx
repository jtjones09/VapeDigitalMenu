import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Droplets, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  shopId: string;
  isKioskMode: boolean;
}

export function CategorySelector({ shopId, isKioskMode }: CategorySelectorProps) {
  // Helper to build URLs that preserve kiosk mode
  const buildUrl = (path: string) => {
    const base = isKioskMode ? '/menu/kiosk' : '/menu';
    return `${base}${path}`;
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-category-title">Choose Your Nicotine Type</h2>
        <p className="text-muted-foreground">Select the type of e-liquid you're looking for</p>
      </div>
      <div className={cn(
        "grid gap-6",
        isKioskMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
      )}>
        <Link href={buildUrl(`/${shopId}/regular`)}>
          <Card 
            className={cn(
              "group hover-elevate cursor-pointer overflow-hidden transition-all",
              isKioskMode ? "min-h-[200px]" : "min-h-[160px]"
            )}
            data-testid="card-regular-nicotine"
          >
            <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Droplets className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className={cn(
                "font-bold text-blue-600 dark:text-blue-400 mb-2",
                isKioskMode ? "text-2xl" : "text-xl"
              )}>
                Regular Nicotine
              </h3>
              <p className={cn(
                "text-muted-foreground text-center",
                isKioskMode ? "text-lg" : "text-sm"
              )}>
                Traditional freebase nicotine (0-24mg)
              </p>
              <p className={cn(
                "text-muted-foreground text-center mt-1",
                isKioskMode ? "text-base" : "text-xs"
              )}>Great for chasing</p>
            </div>
          </Card>
        </Link>

        <Link href={buildUrl(`/${shopId}/salt`)}>
          <Card 
            className={cn(
              "group hover-elevate cursor-pointer overflow-hidden transition-all",
              isKioskMode ? "min-h-[200px]" : "min-h-[160px]"
            )}
            data-testid="card-salt-nicotine"
          >
            <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className={cn(
                "font-bold text-purple-600 dark:text-purple-400 mb-2",
                isKioskMode ? "text-2xl" : "text-xl"
              )}>
                Salt Nicotine
              </h3>
              <p className={cn(
                "text-muted-foreground text-center",
                isKioskMode ? "text-lg" : "text-sm"
              )}>
                Smooth high-strength (10-50mg)
              </p>
              <p className={cn(
                "text-muted-foreground text-center mt-1",
                isKioskMode ? "text-base" : "text-xs"
              )}>
                Fast nicotine satisfaction
              </p>
            </div>
          </Card>
        </Link>
      </div>
      <div className="text-center pt-4">
        <Link 
          href={buildUrl(`/${shopId}/all`)}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          data-testid="link-browse-all"
        >
          Browse all products
        </Link>
      </div>
    </div>
  );
}
