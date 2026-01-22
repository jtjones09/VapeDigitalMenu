import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductWithBrand } from "@shared/schema";

interface SearchBarProps {
  shopId: string;
  nicotineType?: string;
  flavorCategory?: string;
  isKioskMode: boolean;
  onSearchChange?: (value: string) => void;
  currentSearch?: string;
}

const RECENT_SEARCHES_KEY = "vape-menu-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function SearchBar({ 
  shopId, 
  nicotineType, 
  flavorCategory, 
  isKioskMode,
  onSearchChange,
  currentSearch = ""
}: SearchBarProps) {
  const [search, setSearch] = useState(currentSearch);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const modeParam = isKioskMode ? "?mode=kiosk" : "";

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const buildSuggestionsUrl = () => {
    const params = new URLSearchParams();
    params.set("search", search);
    params.set("limit", "5");
    params.set("type", "e-liquid");
    if (nicotineType && nicotineType !== "all") {
      params.set("nicotineType", nicotineType);
    }
    if (flavorCategory && flavorCategory !== "all") {
      params.set("flavor", flavorCategory);
    }
    return `/api/shops/${shopId}/menu?${params.toString()}`;
  };

  const { data: suggestions } = useQuery<ProductWithBrand[]>({
    queryKey: ["/api/shops", shopId, "menu", "suggestions", { search, nicotineType, flavorCategory }],
    queryFn: async () => {
      const res = await fetch(buildSuggestionsUrl());
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    },
    enabled: search.length >= 2,
  });

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) {
      saveRecentSearch(search.trim());
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearch("");
    onSearchChange?.("");
    inputRef.current?.focus();
  };

  const handleSelectRecent = (term: string) => {
    setSearch(term);
    onSearchChange?.(term);
    saveRecentSearch(term);
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scopeText = nicotineType 
    ? flavorCategory 
      ? `${nicotineType === "regular" ? "Regular" : "Salt"} > ${flavorCategory.charAt(0).toUpperCase() + flavorCategory.slice(1)}`
      : nicotineType === "regular" ? "Regular Nicotine" : nicotineType === "salt" ? "Salt Nicotine" : "All"
    : null;

  const showDropdown = isFocused && (
    (search.length >= 2 && suggestions && suggestions.length > 0) ||
    (search.length === 0 && recentSearches.length > 0)
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search for flavors, brands, or products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={cn("pl-9 pr-9", isKioskMode && "h-12 text-lg")}
          data-testid="input-search"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {scopeText && search.length === 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          Currently searching: {scopeText}
        </div>
      )}

      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden shadow-lg">
          <div className="max-h-[300px] overflow-y-auto">
            {search.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </div>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectRecent(term)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm"
                    data-testid={`recent-search-${i}`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}

            {search.length >= 2 && suggestions && suggestions.length > 0 && (
              <div className="p-2">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/menu/${shopId}/product/${product.id}${modeParam}`}
                    onClick={() => {
                      saveRecentSearch(search);
                      setIsFocused(false);
                    }}
                  >
                    <div 
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-md cursor-pointer"
                      data-testid={`suggestion-${product.id}`}
                    >
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.productName}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {highlightMatch(product.productName, search)}
                        </div>
                        {product.brand && (
                          <div className="text-xs text-muted-foreground truncate">
                            {product.brand.brandName}
                          </div>
                        )}
                      </div>
                      {product.nicotineType && product.nicotineType !== "none" && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {product.nicotineType === "regular" ? "Regular" : "Salt"}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => 
    regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : part
  );
}
