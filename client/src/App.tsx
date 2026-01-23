import { Switch, Route } from "wouter";
import { queryClient, getAuthHeaders } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { InstallPrompt } from "@/components/install-prompt";
import { ShopProvider } from "@/contexts/shop-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import CustomerLoginPage from "@/pages/customer-login";
import Onboarding from "@/pages/admin/onboarding";
import Dashboard from "@/pages/admin/dashboard";
import Products from "@/pages/admin/products";
import MyMenu from "@/pages/admin/my-menu";
import Setup from "@/pages/admin/setup";
import Settings from "@/pages/admin/settings";
import CreateShop from "@/pages/admin/create-shop";
import Menu from "@/pages/menu/index";
import type { Shop } from "@shared/schema";

function AdminRoutes() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: shop, isLoading: shopLoading, error: shopError } = useQuery<Shop | null>({
    queryKey: ["/api/shops/my"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/shops/my", {
        headers: await getAuthHeaders(),
        credentials: "include",
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
  });

  if (authLoading || (isAuthenticated && shopLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  if (isAuthenticated && (!shop || shopError)) {
    return <Onboarding />;
  }

  return (
    <ShopProvider>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/products" component={Products} />
        <Route path="/admin/my-menu" component={MyMenu} />
        <Route path="/admin/setup" component={Setup} />
        <Route path="/admin/settings" component={Settings} />
        <Route path="/admin/create-shop" component={CreateShop} />
        <Route component={Dashboard} />
      </Switch>
    </ShopProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AdminRoutes} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/customer-login" component={CustomerLoginPage} />
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />
      {/* Kiosk mode routes - MUST come before personal routes (more specific match) */}
      <Route path="/menu/kiosk/:shopId/product/:productId" component={Menu} />
      <Route path="/menu/kiosk/:shopId/:nicotineType/:flavorCategory" component={Menu} />
      <Route path="/menu/kiosk/:shopId/:nicotineType" component={Menu} />
      <Route path="/menu/kiosk/:shopId" component={Menu} />
      
      {/* Personal mode routes */}
      <Route path="/menu/:shopId/product/:productId" component={Menu} />
      <Route path="/menu/:shopId/:nicotineType/:flavorCategory" component={Menu} />
      <Route path="/menu/:shopId/:nicotineType" component={Menu} />
      <Route path="/menu/:shopId" component={Menu} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <InstallPrompt />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
