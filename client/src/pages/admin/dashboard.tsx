import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Package, List, QrCode, ArrowRight, TrendingUp, Eye } from "lucide-react";
import type { Shop, ShopProduct } from "@shared/schema";

export default function Dashboard() {
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["/api/shops/my"],
  });

  const { data: menuProducts, isLoading: menuLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shops/my/products"],
    enabled: !!shop,
  });

  const stats = [
    {
      title: "Products in Menu",
      value: menuProducts?.length || 0,
      icon: Package,
      description: "Items in your digital menu",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Products",
      value: menuProducts?.filter(p => p.isActive).length || 0,
      icon: Eye,
      description: "Visible to customers",
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div>
          {shopLoading ? (
            <Skeleton className="h-10 w-64" />
          ) : (
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
              Welcome back{shop?.ownerName ? `, ${shop.ownerName.split(" ")[0]}` : ""}!
            </h1>
          )}
          <p className="text-muted-foreground mt-1">
            Here's an overview of your digital menu
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {menuLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}>
                    {stat.value}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Get started with your digital menu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/products" data-testid="link-browse-products">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Browse Product Catalog
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/my-menu" data-testid="link-manage-menu">
                  <span className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Manage My Menu
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/setup" data-testid="link-get-qr">
                  <span className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Get QR Code & Kiosk URL
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Getting Started
              </CardTitle>
              <CardDescription>Tips to set up your menu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Add products to your menu</p>
                    <p className="text-sm text-muted-foreground">
                      Browse our catalog and add items to your shop's menu
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Organize your menu</p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop to reorder products as you like
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Share with customers</p>
                    <p className="text-sm text-muted-foreground">
                      Print QR codes or set up tablets with kiosk mode
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
