import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";
import { useShop } from "@/contexts/shop-context";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  ChevronRight,
  Package,
  Loader2,
  SkipForward,
  Check,
  X,
} from "lucide-react";

const productTypes = ["e-liquid", "disposable", "hardware", "accessory"];
const flavorCategories = ["fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other"];
const nicotineTypes = ["regular", "salt", "none"];

interface ImportFileRow {
  productName: string;
  brandName: string;
  productType: string;
  flavorCategory: string;
  flavorDescription: string;
  nicotineType: string;
  nicotineLevel: string;
  vgPgRatio: string;
  bottleSize: string;
  sku: string;
  msrp: string;
  cost: string;
}

interface MatchResult {
  id: string;
  productName: string;
  brandName: string;
  productType: string;
  flavorCategory: string | null;
  nicotineType: string | null;
  imageUrl: string | null;
  inShopMenu: boolean;
  similarity: number;
}

interface ImportResults {
  totalRows: number;
  matched: Array<{ rowIndex: number; fileRow: ImportFileRow; match: MatchResult }>;
  partial: Array<{ rowIndex: number; fileRow: ImportFileRow; suggestions: MatchResult[] }>;
  unmatched: Array<{ rowIndex: number; fileRow: ImportFileRow }>;
}

type RowResolution =
  | { type: "catalog"; productId: string }
  | { type: "custom"; data: Partial<ImportFileRow> & { productType: string; flavorCategory: string; nicotineType: string } }
  | { type: "skip" };

const TEMPLATE_CSV = `product_name,brand_name,product_type,flavor_category,flavor_description,nicotine_type,nicotine_level,vg_pg_ratio,bottle_size,sku,msrp,cost
Blue Razz Lemonade,Naked 100,e-liquid,fruit,Blue raspberry with lemonade,salt,50mg,70/30,60ml,NK-BRL-50,18.99,8.50
Iced Mango,Pachamama,e-liquid,fruit,Mango with menthol,regular,3mg,70/30,60ml,PCH-MNG-3,15.99,7.00
Cool Mint Disposable,Hyde,disposable,menthol,Cool mint single use,salt,50mg,,,HYD-CM-50,12.99,5.00
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "menuboard-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentShop: shop } = useShop();

  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [resolutions, setResolutions] = useState<Record<number, RowResolution>>({});
  const [customForms, setCustomForms] = useState<Record<number, Partial<ImportFileRow> & { productType: string; flavorCategory: string; nicotineType: string }>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [addProgress, setAddProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = useCallback(() => {
    setStep("upload");
    setFile(null);
    setResults(null);
    setResolutions({});
    setCustomForms({});
    setIsAdding(false);
    setAddProgress({ done: 0, total: 0 });
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase().split(".").pop();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast({ title: "Invalid file", description: "Please select a CSV or Excel file.", variant: "destructive" });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleUpload = async () => {
    if (!file || !shop) return;
    setIsUploading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/shops/${shop.id}/import`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      const data: ImportResults = await res.json();

      // Pre-set resolutions: matched items default to "catalog", rest default to "skip"
      const initialResolutions: Record<number, RowResolution> = {};
      for (const item of data.matched) {
        initialResolutions[item.rowIndex] = { type: "catalog", productId: item.match.id };
      }
      for (const item of data.partial) {
        initialResolutions[item.rowIndex] = { type: "skip" };
      }
      for (const item of data.unmatched) {
        initialResolutions[item.rowIndex] = { type: "skip" };
      }

      setResults(data);
      setResolutions(initialResolutions);
      setStep("review");
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const setResolution = (rowIndex: number, res: RowResolution) => {
    setResolutions((prev) => ({ ...prev, [rowIndex]: res }));
  };

  const updateCustomForm = (rowIndex: number, updates: Partial<ImportFileRow> & { productType?: string; flavorCategory?: string; nicotineType?: string }) => {
    setCustomForms((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], ...updates } as Partial<ImportFileRow> & { productType: string; flavorCategory: string; nicotineType: string },
    }));
  };

  const toggleCustomForRow = (rowIndex: number, fileRow: ImportFileRow) => {
    const current = resolutions[rowIndex];
    if (current?.type === "custom") {
      setResolution(rowIndex, { type: "skip" });
    } else {
      const form = customForms[rowIndex] || {
        productName: fileRow.productName,
        brandName: fileRow.brandName,
        productType: productTypes.find((t) => fileRow.productType.toLowerCase().includes(t)) || "",
        flavorCategory: flavorCategories.find((f) => fileRow.flavorCategory.toLowerCase().includes(f)) || "",
        nicotineType: nicotineTypes.find((n) => fileRow.nicotineType.toLowerCase().includes(n)) || "",
        nicotineLevel: fileRow.nicotineLevel,
        vgPgRatio: fileRow.vgPgRatio,
        bottleSize: fileRow.bottleSize,
        sku: fileRow.sku,
        msrp: fileRow.msrp,
        cost: fileRow.cost,
      };
      setCustomForms((prev) => ({ ...prev, [rowIndex]: form }));
      setResolution(rowIndex, { type: "custom", data: form as Partial<ImportFileRow> & { productType: string; flavorCategory: string; nicotineType: string } });
    }
  };

  const countResolutions = () => {
    let catalog = 0;
    let custom = 0;
    let skipped = 0;
    for (const r of Object.values(resolutions)) {
      if (r.type === "catalog") catalog++;
      else if (r.type === "custom") custom++;
      else skipped++;
    }
    return { catalog, custom, skipped };
  };

  const handleConfirm = async () => {
    if (!shop || !results) return;

    const items: Array<{ rowIndex: number; res: RowResolution }> = Object.entries(resolutions)
      .filter(([, r]) => r.type !== "skip")
      .map(([idx, r]) => ({ rowIndex: parseInt(idx), res: r }));

    if (items.length === 0) {
      toast({ title: "Nothing to add", description: "Select at least one item to import." });
      return;
    }

    setIsAdding(true);
    setAddProgress({ done: 0, total: items.length });

    let successCount = 0;
    let errorCount = 0;

    for (const { res } of items) {
      try {
        const authHeaders = await getAuthHeaders();
        if (res.type === "catalog") {
          const response = await fetch(`/api/shops/${shop.id}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            credentials: "include",
            body: JSON.stringify({ productId: res.productId, isActive: true }),
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            if (err.message !== "Product already in menu") {
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            successCount++;
          }
        } else if (res.type === "custom") {
          const d = res.data;
          const response = await fetch(`/api/shops/${shop.id}/custom-products`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            credentials: "include",
            body: JSON.stringify({
              productName: d.productName,
              productType: d.productType,
              flavorCategory: d.flavorCategory || null,
              flavorDescription: d.flavorDescription || null,
              nicotineType: d.nicotineType || null,
              customBrandName: d.brandName || null,
              variant: {
                nicotineLevel: d.nicotineLevel || null,
                vgPgRatio: d.vgPgRatio || null,
                bottleSize: d.bottleSize || null,
                sku: d.sku || null,
                msrp: d.msrp ? parseFloat(d.msrp) : null,
                cost: d.cost ? parseFloat(d.cost) : null,
              },
            }),
          });
          if (response.ok) successCount++;
          else errorCount++;
        }
      } catch {
        errorCount++;
      }
      setAddProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    queryClient.invalidateQueries({ queryKey: ["/api/shops", shop.id, "products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/shops", shop.id, "custom-products"] });

    setIsAdding(false);
    setStep("done");

    if (errorCount > 0) {
      toast({
        title: `Import partially complete`,
        description: `${successCount} products added, ${errorCount} failed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Import complete!",
        description: `${successCount} product${successCount !== 1 ? "s" : ""} added to your menu.`,
      });
    }
  };

  const counts = countResolutions();
  const hasSelectionsToAdd = counts.catalog + counts.custom > 0;

  const canConfirmCustom = () => {
    if (!results) return true;
    for (const item of results.unmatched) {
      const res = resolutions[item.rowIndex];
      if (res?.type === "custom") {
        const form = customForms[item.rowIndex];
        if (!form?.productType || !form?.flavorCategory || !form?.nicotineType || !form?.productName) return false;
      }
    }
    return true;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isAdding) {
          if (!val) resetDialog();
          onOpenChange(val);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from File</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel spreadsheet to bulk-add products to your menu.
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-import"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                data-testid="input-import-file"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    data-testid="button-clear-file"
                  >
                    <X className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-10 h-10" />
                  <p className="font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm">Accepts CSV and Excel files (.csv, .xlsx)</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">
                Need a template? Download our sample file to see the expected format.
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-template">
                <Download className="w-3 h-3 mr-1" /> Template
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Required column:</p>
              <p><code className="bg-muted px-1 rounded">product_name</code> — the product's name</p>
              <p className="font-medium mt-2">Optional columns:</p>
              <p><code className="bg-muted px-1 rounded">brand_name</code>, <code className="bg-muted px-1 rounded">product_type</code>, <code className="bg-muted px-1 rounded">flavor_category</code>, <code className="bg-muted px-1 rounded">nicotine_type</code>, <code className="bg-muted px-1 rounded">msrp</code>, <code className="bg-muted px-1 rounded">cost</code>, and more</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetDialog(); onOpenChange(false); }} data-testid="button-cancel-import">
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                data-testid="button-upload-import"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
                ) : (
                  <><ChevronRight className="w-4 h-4 mr-2" /> Continue</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: REVIEW ── */}
        {step === "review" && results && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                {results.matched.length} matched
              </Badge>
              <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-300 dark:text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                {results.partial.length} partial
              </Badge>
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <XCircle className="w-3 h-3" />
                {results.unmatched.length} unmatched
              </Badge>
            </div>

            {/* MATCHED */}
            {results.matched.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Matched — found in catalog
                </h3>
                <div className="space-y-2">
                  {results.matched.map(({ rowIndex, fileRow, match }) => {
                    const isChecked = resolutions[rowIndex]?.type === "catalog";
                    return (
                      <div
                        key={rowIndex}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          isChecked ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20" : "border-muted bg-muted/30 opacity-60"
                        }`}
                        data-testid={`matched-row-${rowIndex}`}
                      >
                        <button
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isChecked ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/40"
                          }`}
                          onClick={() =>
                            setResolution(
                              rowIndex,
                              isChecked ? { type: "skip" } : { type: "catalog", productId: match.id }
                            )
                          }
                          data-testid={`checkbox-matched-${rowIndex}`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{match.productName}</p>
                          <p className="text-xs text-muted-foreground">{match.brandName} · {match.productType}</p>
                          {fileRow.productName.toLowerCase() !== match.productName.toLowerCase() && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">
                              from file: "{fileRow.productName}"
                            </p>
                          )}
                        </div>
                        {match.inShopMenu && (
                          <Badge variant="secondary" className="text-xs shrink-0">Already in menu</Badge>
                        )}
                        <span className="text-xs text-green-600 dark:text-green-400 shrink-0 font-medium">
                          {Math.round(match.similarity * 100)}% match
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PARTIAL */}
            {results.partial.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  Partial matches — pick the right one
                </h3>
                <div className="space-y-3">
                  {results.partial.map(({ rowIndex, fileRow, suggestions }) => {
                    const current = resolutions[rowIndex];
                    return (
                      <div key={rowIndex} className="border rounded-lg p-3 space-y-2" data-testid={`partial-row-${rowIndex}`}>
                        <p className="text-sm">
                          <span className="font-medium">"{fileRow.productName}"</span>
                          {fileRow.brandName && <span className="text-muted-foreground"> by {fileRow.brandName}</span>}
                        </p>
                        <div className="space-y-1">
                          {suggestions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() =>
                                setResolution(
                                  rowIndex,
                                  current?.type === "catalog" && (current as { productId: string }).productId === s.id
                                    ? { type: "skip" }
                                    : { type: "catalog", productId: s.id }
                                )
                              }
                              className={`w-full text-left flex items-center gap-2 p-2 rounded border transition-colors text-sm ${
                                current?.type === "catalog" && (current as { type: "catalog"; productId: string }).productId === s.id
                                  ? "border-primary bg-primary/5"
                                  : "border-muted hover:border-muted-foreground/30"
                              }`}
                              data-testid={`suggestion-${rowIndex}-${s.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate">{s.productName}</span>
                                <span className="text-muted-foreground ml-1">— {s.brandName}</span>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">{Math.round(s.similarity * 100)}%</span>
                              {current?.type === "catalog" && (current as { productId: string }).productId === s.id && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setResolution(rowIndex, { type: "skip" })}
                          className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            current?.type === "skip"
                              ? "text-muted-foreground bg-muted"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          data-testid={`skip-partial-${rowIndex}`}
                        >
                          <SkipForward className="w-3 h-3" /> Skip this row
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* UNMATCHED */}
            {results.unmatched.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  Not in catalog — add as custom products
                </h3>
                <div className="space-y-3">
                  {results.unmatched.map(({ rowIndex, fileRow }) => {
                    const current = resolutions[rowIndex];
                    const isCustom = current?.type === "custom";
                    const form = customForms[rowIndex];
                    return (
                      <div key={rowIndex} className="border rounded-lg p-3 space-y-2" data-testid={`unmatched-row-${rowIndex}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">"{fileRow.productName}"</p>
                            {fileRow.brandName && (
                              <p className="text-xs text-muted-foreground">by {fileRow.brandName}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant={isCustom ? "default" : "outline"}
                              onClick={() => toggleCustomForRow(rowIndex, fileRow)}
                              data-testid={`button-add-custom-${rowIndex}`}
                            >
                              {isCustom ? <><Check className="w-3 h-3 mr-1" /> Adding</> : "Add as Custom"}
                            </Button>
                            {!isCustom && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setResolution(rowIndex, { type: "skip" })}
                                className="text-muted-foreground"
                                data-testid={`button-skip-unmatched-${rowIndex}`}
                              >
                                <SkipForward className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {isCustom && form && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Product Name *</label>
                              <Input
                                value={form.productName ?? fileRow.productName}
                                onChange={(e) => {
                                  updateCustomForm(rowIndex, { productName: e.target.value });
                                  setResolution(rowIndex, { type: "custom", data: { ...form, productName: e.target.value } });
                                }}
                                className="h-8 text-sm"
                                data-testid={`input-custom-name-${rowIndex}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Product Type *</label>
                              <Select
                                value={form.productType || ""}
                                onValueChange={(val) => {
                                  updateCustomForm(rowIndex, { productType: val });
                                  setResolution(rowIndex, { type: "custom", data: { ...form, productType: val } });
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm" data-testid={`select-custom-type-${rowIndex}`}>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {productTypes.map((t) => (
                                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Flavor Category *</label>
                              <Select
                                value={form.flavorCategory || ""}
                                onValueChange={(val) => {
                                  updateCustomForm(rowIndex, { flavorCategory: val });
                                  setResolution(rowIndex, { type: "custom", data: { ...form, flavorCategory: val } });
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm" data-testid={`select-custom-flavor-${rowIndex}`}>
                                  <SelectValue placeholder="Select flavor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {flavorCategories.map((f) => (
                                    <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Nicotine Type *</label>
                              <Select
                                value={form.nicotineType || ""}
                                onValueChange={(val) => {
                                  updateCustomForm(rowIndex, { nicotineType: val });
                                  setResolution(rowIndex, { type: "custom", data: { ...form, nicotineType: val } });
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm" data-testid={`select-custom-nicotine-${rowIndex}`}>
                                  <SelectValue placeholder="Select nicotine" />
                                </SelectTrigger>
                                <SelectContent>
                                  {nicotineTypes.map((n) => (
                                    <SelectItem key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {fileRow.msrp && (
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Price (MSRP)</label>
                                <Input
                                  value={form.msrp ?? fileRow.msrp}
                                  onChange={(e) => {
                                    updateCustomForm(rowIndex, { msrp: e.target.value });
                                    setResolution(rowIndex, { type: "custom", data: { ...form, msrp: e.target.value } });
                                  }}
                                  className="h-8 text-sm"
                                  type="number"
                                  step="0.01"
                                  data-testid={`input-custom-msrp-${rowIndex}`}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CONFIRM BAR */}
            <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {counts.catalog + counts.custom > 0 ? (
                  <span>
                    Adding <strong>{counts.catalog + counts.custom}</strong> product{counts.catalog + counts.custom !== 1 ? "s" : ""}
                    {counts.skipped > 0 && `, skipping ${counts.skipped}`}
                  </span>
                ) : (
                  <span>No products selected — check or pick items above</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { resetDialog(); }} data-testid="button-review-back">
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!hasSelectionsToAdd || isAdding || !canConfirmCustom()}
                  data-testid="button-confirm-import"
                >
                  {isAdding ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding {addProgress.done}/{addProgress.total}…</>
                  ) : (
                    <>Add to Menu</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Import complete!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your products have been added to your menu. You can manage them from the My Menu page.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { resetDialog(); onOpenChange(false); }} data-testid="button-import-close">
                Close
              </Button>
              <Button onClick={resetDialog} data-testid="button-import-again">
                Import Another File
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
