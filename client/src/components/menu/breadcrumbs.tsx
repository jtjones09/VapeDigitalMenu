import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbsProps {
  shopId: string;
  nicotineType?: string;
  flavorCategory?: string;
  isKioskMode: boolean;
}

export function Breadcrumbs({ shopId, nicotineType, flavorCategory, isKioskMode }: BreadcrumbsProps) {
  const [, setLocation] = useLocation();
  const modeParam = isKioskMode ? "?mode=kiosk" : "";
  
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

  const backLink = flavorCategory 
    ? `/menu/${shopId}/${nicotineType}${modeParam}`
    : `/menu/${shopId}${modeParam}`;

  const handleBack = () => {
    setLocation(backLink);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
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
            <Link 
              href={`/menu/${shopId}/${nicotineType}${modeParam}`}
              className="hover:text-foreground hover:underline underline-offset-4"
              data-testid="breadcrumb-nicotine"
            >
              {nicotineLabel}
            </Link>
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
