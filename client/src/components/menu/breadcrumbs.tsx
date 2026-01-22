import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbsProps {
  shopId: string;
  nicotineType?: string;
  flavorCategory?: string;
  isKioskMode: boolean;
}

export function Breadcrumbs({ shopId, nicotineType, flavorCategory, isKioskMode }: BreadcrumbsProps) {
  const [, navigate] = useLocation();
  
  // Helper to build URLs that preserve kiosk mode
  const buildUrl = (path: string) => {
    const base = isKioskMode ? '/menu/kiosk' : '/menu';
    return `${base}${path}`;
  };
  
  if (!nicotineType) {
    return null;
  }

  const nicotineLabel = nicotineType === "regular" 
    ? "Regular Nicotine" 
    : nicotineType === "salt" 
      ? "Salt Nicotine" 
      : "All Products";

  const flavorLabel = flavorCategory 
    ? flavorCategory.charAt(0).toUpperCase() + flavorCategory.slice(1)
    : null;

  const nicotineLink = buildUrl(`/${shopId}/${nicotineType}`);
  const landingLink = buildUrl(`/${shopId}`);
  
  const backLink = flavorCategory ? nicotineLink : landingLink;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(backLink)}
        className="gap-1"
        data-testid="button-back"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>
      
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="hidden sm:inline">/</span>
        
        {flavorCategory ? (
          <>
            <button
              onClick={() => navigate(nicotineLink)}
              className="hover:text-foreground hover:underline underline-offset-4 cursor-pointer"
              data-testid="breadcrumb-nicotine"
            >
              {nicotineLabel}
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-foreground" data-testid="breadcrumb-flavor">
              {flavorLabel}
            </span>
          </>
        ) : (
          <span className="font-medium text-foreground" data-testid="breadcrumb-nicotine">
            {nicotineLabel}
          </span>
        )}
      </div>
    </div>
  );
}
