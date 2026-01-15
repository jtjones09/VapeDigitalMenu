import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Shop } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function CreateShop() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const createShopMutation = useMutation({
    mutationFn: async (data: typeof formData): Promise<Shop> => {
      const res = await apiRequest("POST", "/api/shops/create", data);
      return res.json();
    },
    onSuccess: (newShop: Shop) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops/list"] });
      toast({
        title: "Shop Created!",
        description: `${newShop.shopName} has been added successfully.`,
      });
      
      localStorage.setItem("selectedShopId", newShop.id);
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shop",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShopMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => setLocation("/admin")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Shop</CardTitle>
            <CardDescription>
              Add another shop location to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleChange("shopName", e.target.value)}
                  required
                  data-testid="input-shop-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                  data-testid="input-owner-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  data-testid="input-address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    data-testid="input-state"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    data-testid="input-zip"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createShopMutation.isPending || !formData.shopName.trim()}
                  className="flex-1"
                  data-testid="button-create-shop"
                >
                  {createShopMutation.isPending ? "Creating..." : "Create Shop"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
