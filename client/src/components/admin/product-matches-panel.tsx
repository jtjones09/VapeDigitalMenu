import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Eye, Plus } from "lucide-react";

interface ProductMatch {
  id: string;
  productName: string;
  brandName: string;
  productType: string;
  similarity: number;
  variantCount: number;
}

interface ProductMatchesPanelProps {
  matches: ProductMatch[];
  isSearching: boolean;
  onViewProduct: (productId: string) => void;
  onUseProduct: (productId: string) => void;
}

function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.9) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (similarity >= 0.7) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
}

export function ProductMatchesPanel({
  matches,
  isSearching,
  onViewProduct,
  onUseProduct,
}: ProductMatchesPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Possible Matches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Searching for matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="w-6 h-6 mb-2 text-green-500" />
            <p className="text-sm text-center">No matching products found.</p>
            <p className="text-xs text-center mt-1">Your product appears to be unique!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Found {matches.length} similar product{matches.length !== 1 ? "s" : ""}:
            </p>
            <div className="space-y-2">
              {matches.map((match) => (
                <Card key={match.id} className="p-3" data-testid={`match-card-${match.id}`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{match.productName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {match.brandName} - {match.productType}
                        </p>
                      </div>
                      <Badge className={`shrink-0 ${getSimilarityColor(match.similarity)}`}>
                        {Math.round(match.similarity * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Global</Badge>
                        <span className="text-xs text-muted-foreground">
                          {match.variantCount} variant{match.variantCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onViewProduct(match.id)}
                        data-testid={`button-view-${match.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onUseProduct(match.id)}
                        data-testid={`button-use-${match.id}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Use This
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
