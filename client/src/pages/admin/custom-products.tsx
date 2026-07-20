import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Package, Filter, Pencil, Trash2, Upload, ImageIcon, X, Camera, FileUp } from "lucide-react";
import { useShop } from "@/contexts/shop-context";
import { ProductMatchesPanel } from "@/components/admin/product-matches-panel";
import { BulkImportDialog } from "@/components/admin/bulk-import-dialog";
import { insertProductSchema, type ProductWithBrand } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const productTypes = ["e-liquid", "disposable", "hardware", "accessory"];
const flavorCategories = ["fruit", "dessert", "menthol", "tobacco", "beverage", "candy", "other"];
const nicotineTypes = ["regular", "salt", "none"];

const productFormSchema = insertProductSchema.pick({
  productName: true,
  productType: true,
  flavorCategory: true,
  flavorDescription: true,
  nicotineType: true,
  imageUrl: true,
}).extend({
  productName: z.string().min(1, "Product name is required"),
  productType: z.string().min(1, "Product type is required"),
  customBrandName: z.string().min(1, "Brand name is required"),
  flavorCategory: z.string().min(1, "Flavor category is required"),
  nicotineType: z.string().min(1, "Nicotine type is required"),
  flavorDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  variantNicotineLevel: z.string().optional(),
  variantVgPgRatio: z.string().optional(),
  variantBottleSize: z.string().optional(),
  variantSku: z.string().optional(),
  variantMsrp: z.string().optional(),
  variantCost: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductMatch {
  id: string;
  productName: string;
  brandName: string;
  productType: string;
  nicotineType: string | null;
  flavorCategory: string | null;
  flavorDescription: string | null;
  imageUrl: string | null;
  similarity: number;
  variantCount: number;
  inShopMenu: boolean;
}

interface BrandMatch {
  id: string;
  brandName: string;
  similarity: number;
  logoUrl: string | null;
  productCount: number;
}

interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
  disabled?: boolean;
}

function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL, objectPath } = await response.json();

      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setPreviewUrl(objectPath);
      onChange(objectPath);

      toast({
        title: "Image uploaded",
        description: "Your product image has been uploaded.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        data-testid="input-image-file"
      />
      
      {previewUrl ? (
        <div className="relative w-full aspect-square max-w-[200px] rounded-md overflow-hidden border">
          <img
            src={previewUrl}
            alt="Product preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            data-testid="button-remove-image"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className="w-full aspect-square max-w-[200px] rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover-elevate"
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          data-testid="button-upload-image"
        >
          {isUploading ? (
            <>
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Camera className="w-6 h-6 text-muted-foreground" />
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground text-center px-2">
                Tap to take photo or upload
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ProductFormFieldsProps {
  form: ReturnType<typeof useForm<ProductFormData>>;
  onSearchTrigger?: () => void;
}

const SearchFormFields = ({ form, onSearchTrigger }: ProductFormFieldsProps) => (
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="customBrandName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Brand Name *</FormLabel>
          <FormControl>
            <Input 
              placeholder="Enter brand name" 
              {...field} 
              onChange={(e) => {
                field.onChange(e);
                onSearchTrigger?.();
              }}
              data-testid="input-brand-name" 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="productName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product Name *</FormLabel>
          <FormControl>
            <Input 
              placeholder="Enter product name" 
              {...field} 
              onChange={(e) => {
                field.onChange(e);
                onSearchTrigger?.();
              }}
              data-testid="input-product-name" 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const DetailFormFields = ({ form, onSearchTrigger }: ProductFormFieldsProps) => (
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="productType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product Type *</FormLabel>
          <Select onValueChange={(value) => {
            field.onChange(value);
            onSearchTrigger?.();
          }} value={field.value}>
            <FormControl>
              <SelectTrigger data-testid="select-product-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {productTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="nicotineType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nicotine Type *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl>
              <SelectTrigger data-testid="select-nicotine-type">
                <SelectValue placeholder="Select nicotine type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {nicotineTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="flavorCategory"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Flavor Category *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl>
              <SelectTrigger data-testid="select-flavor-category">
                <SelectValue placeholder="Select flavor" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {flavorCategories.map((flavor) => (
                <SelectItem key={flavor} value={flavor}>
                  {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="flavorDescription"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Flavor Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe the flavor profile..."
              className="resize-none"
              {...field}
              value={field.value ?? ""}
              data-testid="input-flavor-description"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="imageUrl"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Product Image</FormLabel>
          <FormControl>
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              disabled={field.disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const ProductFormFields = ({ form, onSearchTrigger }: ProductFormFieldsProps) => (
  <div className="space-y-4">
    <SearchFormFields form={form} onSearchTrigger={onSearchTrigger} />
    <DetailFormFields form={form} onSearchTrigger={onSearchTrigger} />
  </div>
);

export default function CustomProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flavorFilter, setFlavorFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithBrand | null>(null);
  const [productMatches, setProductMatches] = useState<ProductMatch[]>([]);
  const [brandMatches, setBrandMatches] = useState<BrandMatch[]>([]);
  const [matchMode, setMatchMode] = useState<"idle" | "brand" | "product">("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [viewProductInMenu, setViewProductInMenu] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [pendingAddProductId, setPendingAddProductId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    nicotineLevel: "",
    vgPgRatio: "",
    bottleSize: "",
    sku: "",
    msrp: "",
    cost: "",
  });

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { currentShop: shop } = useShop();

  const buildCustomProductsQueryKey = () => {
    return ["/api/shops", shop?.id, "custom-products", { search, type: typeFilter, flavor: flavorFilter }];
  };

  const { data: customProducts, isLoading: productsLoading } = useQuery<ProductWithBrand[]>({
    queryKey: buildCustomProductsQueryKey(),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (flavorFilter !== "all") params.set("flavor", flavorFilter);
      const queryString = params.toString();
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/shops/${shop?.id}/custom-products${queryString ? `?${queryString}` : ""}`, {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to fetch custom products");
      return res.json();
    },
    enabled: !!shop,
  });

  const createForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productName: "",
      productType: "",
      flavorCategory: "",
      flavorDescription: "",
      nicotineType: "",
      imageUrl: "",
      customBrandName: "",
      variantNicotineLevel: "",
      variantVgPgRatio: "",
      variantBottleSize: "",
      variantSku: "",
      variantMsrp: "",
      variantCost: "",
    },
  });

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>("");

  const triggerSearch = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      const values = createForm.getValues();
      const productName = values.productName || "";
      const brandName = values.customBrandName || "";
      
      const hasBrandInput = brandName.length >= 3;
      const hasProductInput = productName.length >= 3;
      
      if (!hasBrandInput && !hasProductInput) {
        setMatchMode("idle");
        setBrandMatches([]);
        setProductMatches([]);
        return;
      }

      const searchKey = `${productName}|${values.productType}|${brandName}|${selectedBrandId}`;
      if (searchKey === lastSearchRef.current) {
        return;
      }

      lastSearchRef.current = searchKey;
      setIsSearching(true);
      
      try {
        const authHeaders = await getAuthHeaders();
        
        if (hasBrandInput && !selectedBrandId) {
          setMatchMode("brand");
          const response = await fetch(`/api/brands/search?q=${encodeURIComponent(brandName)}`, {
            credentials: "include",
            headers: authHeaders,
          });
          if (response.ok) {
            const data = await response.json();
            setBrandMatches(data.brands || []);
          }
        } else if (hasProductInput && selectedBrandId) {
          setMatchMode("product");
          const response = await fetch("/api/products/search-duplicates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            credentials: "include",
            body: JSON.stringify({
              productName: productName,
              productType: values.productType || undefined,
              brandName: brandName || undefined,
              brandId: selectedBrandId,
              shopId: shop?.id,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setProductMatches(data.matches || []);
          }
        } else if (hasProductInput && !hasBrandInput) {
          setMatchMode("product");
          const response = await fetch("/api/products/search-duplicates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            credentials: "include",
            body: JSON.stringify({
              productName: productName,
              productType: values.productType || undefined,
              shopId: shop?.id,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setProductMatches(data.matches || []);
          }
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleUseBrand = (brandId: string, brandName: string) => {
    createForm.setValue("customBrandName", brandName);
    setSelectedBrandId(brandId);
    setBrandMatches([]);
    
    const productName = createForm.getValues("productName") || "";
    if (productName.length >= 3) {
      setMatchMode("product");
      lastSearchRef.current = "";
      setTimeout(() => triggerSearch(), 0);
    } else {
      setMatchMode("idle");
    }
  };

  useEffect(() => {
    if (!createDialogOpen) {
      setProductMatches([]);
      setBrandMatches([]);
      setMatchMode("idle");
      setIsSearching(false);
      setSelectedBrandId(null);
      lastSearchRef.current = "";
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    }
  }, [createDialogOpen]);

  const { data: viewedProduct, isLoading: viewedProductLoading } = useQuery<ProductWithBrand>({
    queryKey: ["/api/products", viewProductId],
    queryFn: async () => {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/products/${viewProductId}`, {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!viewProductId,
  });

  const editForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productName: "",
      productType: "",
      flavorCategory: "",
      flavorDescription: "",
      nicotineType: "",
      imageUrl: "",
      customBrandName: "",
    },
  });

  const handleViewProduct = (productId: string, inMenu?: boolean) => {
    setViewProductId(productId);
    setViewProductInMenu(!!inMenu);
    if (inMenu) {
      setShowAddVariantForm(true);
    }
  };

  const handleSelectProduct = (match: ProductMatch) => {
    createForm.setValue("productName", match.productName);
    createForm.setValue("customBrandName", match.brandName);
    createForm.setValue("productType", match.productType);
    if (match.nicotineType) {
      createForm.setValue("nicotineType", match.nicotineType);
    }
    if (match.flavorCategory) {
      createForm.setValue("flavorCategory", match.flavorCategory);
    }
    if (match.flavorDescription) {
      createForm.setValue("flavorDescription", match.flavorDescription);
    }
    if (match.imageUrl) {
      createForm.setValue("imageUrl", match.imageUrl);
    }
    handleViewProduct(match.id, match.inShopMenu);
  };

  const handleUseProduct = (productId: string) => {
    setPendingAddProductId(productId);
    setViewProductId(productId);
    setViewProductInMenu(false);
    setShowAddVariantForm(true);
    setCreateDialogOpen(false);
    createForm.reset();
    setProductMatches([]);
    setBrandMatches([]);
    setMatchMode("idle");
    setSelectedBrandId(null);
  };

  const addProductToMenu = async (productId: string) => {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`/api/shops/${shop?.id}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      credentials: "include",
      body: JSON.stringify({
        productId,
        isActive: true,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to add product");
    }
    queryClient.invalidateQueries({ queryKey: ["/api/shops", shop?.id, "products"] });
  };

  const invalidateCustomProducts = () => {
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && 
          key[0] === "/api/shops" && 
          key[1] === shop?.id && 
          key[2] === "custom-products";
      }
    });
    queryClient.invalidateQueries({ queryKey: ["/api/shops", shop?.id, "products"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest("POST", `/api/shops/${shop?.id}/custom-products`, {
        productName: data.productName,
        productType: data.productType,
        flavorCategory: data.flavorCategory,
        flavorDescription: data.flavorDescription,
        nicotineType: data.nicotineType,
        imageUrl: data.imageUrl,
        customBrandName: data.customBrandName,
        variant: {
          nicotineLevel: data.variantNicotineLevel || null,
          vgPgRatio: data.variantVgPgRatio || null,
          bottleSize: data.variantBottleSize || null,
          sku: data.variantSku || null,
          msrp: data.variantMsrp ? parseFloat(data.variantMsrp) : null,
          cost: data.variantCost ? parseFloat(data.variantCost) : null,
        },
      });
    },
    onSuccess: () => {
      invalidateCustomProducts();
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Product created",
        description: "Your custom product has been created and added to your menu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      await apiRequest("PATCH", `/api/shops/${shop?.id}/custom-products/${id}`, data);
    },
    onSuccess: () => {
      invalidateCustomProducts();
      setEditDialogOpen(false);
      setEditingProduct(null);
      editForm.reset();
      toast({
        title: "Product updated",
        description: "Your custom product has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/shops/${shop?.id}/custom-products/${productId}`);
    },
    onSuccess: () => {
      invalidateCustomProducts();
      toast({
        title: "Product deleted",
        description: "Your custom product has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const addVariantMutation = useMutation({
    mutationFn: async ({ productId, variant, addToMenu }: { productId: string; variant: typeof newVariant; addToMenu?: boolean }) => {
      if (addToMenu) {
        await addProductToMenu(productId);
      }
      const response = await apiRequest("POST", `/api/shops/${shop?.id}/products/${productId}/variants`, {
        nicotineLevel: variant.nicotineLevel || null,
        vgPgRatio: variant.vgPgRatio || null,
        bottleSize: variant.bottleSize || null,
        sku: variant.sku || null,
        msrp: variant.msrp ? parseFloat(variant.msrp) : null,
        cost: variant.cost ? parseFloat(variant.cost) : null,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", viewProductId] });
      if (variables.addToMenu) {
        toast({
          title: "Product added",
          description: "The product and your custom variant have been added to your menu.",
        });
        setViewProductId(null);
        setPendingAddProductId(null);
      } else {
        toast({
          title: "Variant added",
          description: "Your custom variant has been added to this product.",
        });
      }
      setShowAddVariantForm(false);
      setNewVariant({ nicotineLevel: "", vgPgRatio: "", bottleSize: "", sku: "", msrp: "", cost: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add variant",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: ProductWithBrand) => {
    setEditingProduct(product);
    editForm.reset({
      productName: product.productName,
      productType: product.productType,
      flavorCategory: product.flavorCategory || "",
      flavorDescription: product.flavorDescription || "",
      nicotineType: product.nicotineType || "",
      imageUrl: product.imageUrl || "",
      customBrandName: product.customBrandName || product.brand?.brandName || "",
    });
    setEditDialogOpen(true);
  };

  const onCreateSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const flavorColors: Record<string, string> = {
    fruit: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    dessert: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    menthol: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    tobacco: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    beverage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    candy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-custom-products-title">My Custom Products</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your own products
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="button-open-import">
              <FileUp className="w-4 h-4 mr-2" />
              Import from File
            </Button>

          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              createForm.reset();
              setProductMatches([]);
              setBrandMatches([]);
              setMatchMode("idle");
              setSelectedBrandId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Product</DialogTitle>
                <DialogDescription>
                  Add a new product that's unique to your shop. We'll check for similar products in the global catalog.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-5 gap-6">
                    <div className="md:col-span-3 space-y-4">
                      <SearchFormFields form={createForm} onSearchTrigger={triggerSearch} />
                      
                      <div className="md:hidden">
                        <ProductMatchesPanel
                          mode={matchMode}
                          brandMatches={brandMatches}
                          productMatches={productMatches}
                          isSearching={isSearching}
                          onViewProduct={handleViewProduct}
                          onSelectProduct={handleSelectProduct}
                          onUseProduct={handleUseProduct}
                          onUseBrand={handleUseBrand}
                        />
                      </div>
                      
                      <DetailFormFields form={createForm} onSearchTrigger={triggerSearch} />
                      
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-3">Initial Variant (Required)</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={createForm.control}
                            name="variantNicotineLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Nicotine Level</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 3mg" {...field} data-testid="input-variant-nicotine" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="variantVgPgRatio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">VG/PG Ratio</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 70/30" {...field} data-testid="input-variant-vgpg" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="variantBottleSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Size</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 60ml" {...field} data-testid="input-variant-size" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="variantSku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">SKU</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional" {...field} data-testid="input-variant-sku" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="variantMsrp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">MSRP ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-variant-msrp" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="variantCost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Cost ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-variant-cost" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block md:col-span-2">
                      <ProductMatchesPanel
                        mode={matchMode}
                        brandMatches={brandMatches}
                        productMatches={productMatches}
                        isSearching={isSearching}
                        onViewProduct={handleViewProduct}
                        onSelectProduct={handleSelectProduct}
                        onUseProduct={handleUseProduct}
                        onUseBrand={handleUseBrand}
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                        setCreateDialogOpen(false);
                        createForm.reset();
                        setProductMatches([]);
                        setBrandMatches([]);
                        setMatchMode("idle");
                        setSelectedBrandId(null);
                      }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                      {createMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>

          <BulkImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

          <Dialog open={!!viewProductId} onOpenChange={(open) => {
            if (!open) {
              setViewProductId(null);
              setViewProductInMenu(false);
              setShowAddVariantForm(false);
              setPendingAddProductId(null);
              setNewVariant({ nicotineLevel: "", vgPgRatio: "", bottleSize: "", sku: "", msrp: "", cost: "" });
            }
          }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{pendingAddProductId ? "Add Product to Menu" : "Product Details"}</DialogTitle>
                {pendingAddProductId && (
                  <DialogDescription>
                    Add at least one variant to include this product in your menu.
                  </DialogDescription>
                )}
              </DialogHeader>
              {viewedProductLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : viewedProduct ? (
                <div className="space-y-4">
                  {viewedProduct.imageUrl && (
                    <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                      <img
                        src={viewedProduct.imageUrl}
                        alt={viewedProduct.productName}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{viewedProduct.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {viewedProduct.brand?.brandName || viewedProduct.customBrandName || "Unknown Brand"}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{viewedProduct.productType}</Badge>
                      {viewedProduct.flavorCategory && (
                        <Badge variant="secondary">{viewedProduct.flavorCategory}</Badge>
                      )}
                      {viewedProduct.nicotineType && (
                        <Badge variant="secondary">{viewedProduct.nicotineType}</Badge>
                      )}
                    </div>
                    {viewedProduct.flavorDescription && (
                      <p className="text-sm">{viewedProduct.flavorDescription}</p>
                    )}
                    {viewedProduct.variants && viewedProduct.variants.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            {viewedProduct.variants.length} Variant{viewedProduct.variants.length !== 1 ? "s" : ""}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddVariantForm(!showAddVariantForm)}
                            data-testid="button-toggle-add-variant"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Custom Variant
                          </Button>
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                          <div className="flex flex-wrap gap-1">
                            {viewedProduct.variants.map((variant, i) => {
                              const label = [variant.nicotineLevel, variant.bottleSize, variant.vgPgRatio]
                                .filter(Boolean)
                                .join(" / ") || `Variant ${i + 1}`;
                              return (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {showAddVariantForm && (
                      <div className="pt-3 border-t space-y-3">
                        <p className="text-sm font-medium">Add Your Custom Variant</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={newVariant.nicotineLevel}
                            onValueChange={(v) => setNewVariant({ ...newVariant, nicotineLevel: v })}
                          >
                            <SelectTrigger data-testid="select-variant-nicotine">
                              <SelectValue placeholder="Nicotine" />
                            </SelectTrigger>
                            <SelectContent>
                              {["0mg", "3mg", "6mg", "12mg", "18mg", "24mg", "50mg"].map((level) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={newVariant.vgPgRatio}
                            onValueChange={(v) => setNewVariant({ ...newVariant, vgPgRatio: v })}
                          >
                            <SelectTrigger data-testid="select-variant-vgpg">
                              <SelectValue placeholder="VG/PG" />
                            </SelectTrigger>
                            <SelectContent>
                              {["50/50", "60/40", "70/30", "80/20", "MAX VG"].map((ratio) => (
                                <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={newVariant.bottleSize}
                            onValueChange={(v) => setNewVariant({ ...newVariant, bottleSize: v })}
                          >
                            <SelectTrigger data-testid="select-variant-size">
                              <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {["10ml", "30ml", "60ml", "100ml", "120ml"].map((size) => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="SKU (optional)"
                            value={newVariant.sku}
                            onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                            data-testid="input-variant-sku"
                          />
                          <Input
                            placeholder="MSRP ($)"
                            type="number"
                            step="0.01"
                            value={newVariant.msrp}
                            onChange={(e) => setNewVariant({ ...newVariant, msrp: e.target.value })}
                            data-testid="input-variant-msrp"
                          />
                          <Input
                            placeholder="Cost ($)"
                            type="number"
                            step="0.01"
                            value={newVariant.cost}
                            onChange={(e) => setNewVariant({ ...newVariant, cost: e.target.value })}
                            data-testid="input-variant-cost"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddVariantForm(false);
                              setNewVariant({ nicotineLevel: "", vgPgRatio: "", bottleSize: "", sku: "", msrp: "", cost: "" });
                            }}
                            data-testid="button-cancel-variant"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (viewProductId) {
                                addVariantMutation.mutate({ 
                                  productId: viewProductId, 
                                  variant: newVariant,
                                  addToMenu: !!pendingAddProductId 
                                });
                              }
                            }}
                            disabled={addVariantMutation.isPending || (!newVariant.nicotineLevel && !newVariant.vgPgRatio && !newVariant.bottleSize)}
                            data-testid="button-save-variant"
                          >
                            {addVariantMutation.isPending ? "Adding..." : (pendingAddProductId ? "Add to Menu" : "Add Variant")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Product not found</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setViewProductId(null);
                  setViewProductInMenu(false);
                  setShowAddVariantForm(false);
                  setPendingAddProductId(null);
                  setNewVariant({ nicotineLevel: "", vgPgRatio: "", bottleSize: "", sku: "", msrp: "", cost: "" });
                }}>
                  {pendingAddProductId ? "Cancel" : "Close"}
                </Button>
                {viewedProduct && !viewProductInMenu && !pendingAddProductId && (
                  <Button onClick={() => {
                    handleUseProduct(viewedProduct.id);
                  }}>
                    Use This Product
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search custom products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-custom"
              />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={flavorFilter} onValueChange={setFlavorFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-flavor-filter">
                  <SelectValue placeholder="Flavor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flavors</SelectItem>
                  {flavorCategories.map((flavor) => (
                    <SelectItem key={flavor} value={flavor}>
                      {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {productsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : customProducts?.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No custom products yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first custom product to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customProducts?.map((product) => (
              <Card key={product.id} className="w-full overflow-hidden" data-testid={`card-custom-product-${product.id}`}>
                <div className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {product.flavorCategory && (
                      <Badge
                        variant="secondary"
                        className={flavorColors[product.flavorCategory] || flavorColors.other}
                      >
                        {product.flavorCategory}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      Custom
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold line-clamp-2" data-testid={`text-custom-product-name-${product.id}`}>
                      {product.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {product.productType}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete product?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{product.productName}" and remove it from your menu. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Custom Product</DialogTitle>
              <DialogDescription>
                Update your custom product details.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <ProductFormFields form={editForm} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
