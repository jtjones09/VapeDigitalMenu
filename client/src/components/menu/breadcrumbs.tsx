import { useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  shopId: string;
  nicotineType?: string;
  flavorCategory?: string;
  isKioskMode: boolean;
  productName?: string;
  isProductView?: boolean;
}

export function Breadcrumbs({ shopId, nicotineType, flavorCategory, isKioskMode, productName, isProductView }: BreadcrumbsProps) {
  const [, navigate] = useLocation();
  
  const buildUrl = (path: string) => {
    const base = isKioskMode ? '/menu/kiosk' : '/menu';
    return `${base}${path}`;
  };
  
  // Show breadcrumbs when we have any navigation context
  // This includes nicotineType selection, or product view (even while loading)
  if (!nicotineType && !isProductView) {
    return null;
  }

  const nicotineLabel = nicotineType === "regular" 
    ? "Regular" 
    : nicotineType === "salt" 
      ? "Salt" 
      : "All";

  const flavorLabel = flavorCategory 
    ? flavorCategory.charAt(0).toUpperCase() + flavorCategory.slice(1)
    : null;

  const landingLink = buildUrl(`/${shopId}`);
  const nicotineLink = nicotineType ? buildUrl(`/${shopId}/${nicotineType}`) : landingLink;
  const flavorLink = flavorCategory && nicotineType ? buildUrl(`/${shopId}/${nicotineType}/${flavorCategory}`) : nicotineLink;

  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 flex-wrap">
        <li>
          <button
            onClick={() => navigate(landingLink)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="breadcrumb-home"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </li>
        
        {nicotineType && (
          <>
            <li className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-0.5" />
            </li>
            
            <li>
              {flavorCategory || productName ? (
                <button
                  onClick={() => navigate(nicotineLink)}
                  className="px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="breadcrumb-nicotine"
                >
                  {nicotineLabel}
                </button>
              ) : (
                <span 
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary"
                  data-testid="breadcrumb-nicotine"
                >
                  {nicotineLabel}
                </span>
              )}
            </li>
          </>
        )}
        
        {flavorCategory && (
          <>
            <li className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-0.5" />
            </li>
            <li>
              {productName ? (
                <button
                  onClick={() => navigate(flavorLink)}
                  className="px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="breadcrumb-flavor"
                >
                  {flavorLabel}
                </button>
              ) : (
                <span 
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary"
                  data-testid="breadcrumb-flavor"
                >
                  {flavorLabel}
                </span>
              )}
            </li>
          </>
        )}

        {productName && (
          <>
            <li className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-0.5" />
            </li>
            <li>
              <span 
                className="px-3 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary max-w-[200px] truncate inline-block"
                data-testid="breadcrumb-product"
              >
                {productName}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
