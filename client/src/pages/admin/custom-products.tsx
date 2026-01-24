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
import { Search, Plus, Package, Filter, Pencil, Trash2, Upload, ImageIcon, X, Camera } from "lucide-react";
import { useShop } from "@/contexts/shop-context";
import { ProductMatchesPanel } from "@/components/admin/product-matches-panel";
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
  customBrandName: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductMatch {
  id: string;
  productName: string;
  brandName: string;
  productType: string;
  similarity: number;
  variantCount: number;
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

export default function CustomProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flavorFilter, setFlavorFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithBrand | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<ProductMatch[]>([]);
  const [isSearchingDuplicates, setIsSearchingDuplicates] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);

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
    },
  });

  const watchedProductName = createForm.watch("productName");
  const watchedProductType = createForm.watch("productType");
  const watchedBrandName = createForm.watch("customBrandName");

  useEffect(() => {
    if (!createDialogOpen) {
      setDuplicateMatches([]);
      return;
    }

    if (!watchedProductName || watchedProductName.length < 3) {
      setDuplicateMatches([]);
      return;
    }

    setIsSearchingDuplicates(true);

    const timer = setTimeout(async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch("/api/products/search-duplicates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          credentials: "include",
          body: JSON.stringify({
            productName: watchedProductName,
            productType: watchedProductType || undefined,
            brandName: watchedBrandName || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDuplicateMatches(data.matches || []);
        }
      } catch (error) {
        console.error("Duplicate search failed:", error);
      } finally {
        setIsSearchingDuplicates(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedProductName, watchedProductType, watchedBrandName, createDialogOpen]);

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

  const handleViewProduct = (productId: string) => {
    setViewProductId(productId);
  };

  const handleUseProduct = async (productId: string) => {
    try {
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

      toast({
        title: "Product added",
        description: "The product has been added to your menu.",
      });
      setCreateDialogOpen(false);
      createForm.reset();
      setDuplicateMatches([]);
      queryClient.invalidateQueries({ queryKey: ["/api/shops", shop?.id, "products"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to menu",
        variant: "destructive",
      });
    }
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
      await apiRequest("POST", `/api/shops/${shop?.id}/custom-products`, data);
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

  const ProductFormFields = ({ form }: { form: ReturnType<typeof useForm<ProductFormData>> }) => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="productName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter product name" {...field} data-testid="input-product-name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="customBrandName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter brand name (optional)" {...field} data-testid="input-brand-name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="productType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Type *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
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
        name="flavorCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Flavor Category</FormLabel>
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
        name="nicotineType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nicotine Type</FormLabel>
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
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
              <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-3">
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <ProductFormFields form={createForm} />
                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                          {createMutation.isPending ? "Creating..." : "Create Product"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
                <div className="md:col-span-2">
                  <ProductMatchesPanel
                    matches={duplicateMatches}
                    isSearching={isSearchingDuplicates}
                    onViewProduct={handleViewProduct}
                    onUseProduct={handleUseProduct}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewProductId} onOpenChange={(open) => !open && setViewProductId(null)}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
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
                        <p className="text-sm font-medium mb-2">
                          {viewedProduct.variants.length} Variant{viewedProduct.variants.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {viewedProduct.variants.slice(0, 8).map((variant, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {variant.variantName}
                            </Badge>
                          ))}
                          {viewedProduct.variants.length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{viewedProduct.variants.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Product not found</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewProductId(null)}>
                  Close
                </Button>
                {viewedProduct && (
                  <Button onClick={() => {
                    handleUseProduct(viewedProduct.id);
                    setViewProductId(null);
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
