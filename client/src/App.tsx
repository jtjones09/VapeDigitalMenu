import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/admin/onboarding";
import Dashboard from "@/pages/admin/dashboard";
import Products from "@/pages/admin/products";
import MyMenu from "@/pages/admin/my-menu";
import Setup from "@/pages/admin/setup";
import Settings from "@/pages/admin/settings";
import Menu from "@/pages/menu/index";
import ProductDetail from "@/pages/menu/product";
import type { Shop } from "@shared/schema";

function AdminRoutes() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["/api/shops/my"],
    enabled: isAuthenticated,
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

  if (isAuthenticated && !shop) {
    return <Onboarding />;
  }

  return (
    <Switch>
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/products" component={Products} />
      <Route path="/admin/my-menu" component={MyMenu} />
      <Route path="/admin/setup" component={Setup} />
      <Route path="/admin/settings" component={Settings} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AdminRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />
      <Route path="/menu/:shopId" component={Menu} />
      <Route path="/menu/:shopId/product/:productId" component={ProductDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
