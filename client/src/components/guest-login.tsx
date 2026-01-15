import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, LogIn, Users, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminAccessModal } from "./admin-access-modal";

interface GuestLoginProps {
  onLoginClick: () => void;
  onGuestClick: () => void;
  shopName?: string;
  logoUrl?: string | null;
  isKiosk?: boolean;
  shopId?: string;
}

export function GuestLogin({ onLoginClick, onGuestClick, shopName, logoUrl, isKiosk = true, shopId }: GuestLoginProps) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className={cn("w-full", isKiosk ? "max-w-lg" : "max-w-md")}>
        <CardHeader className={cn("text-center", isKiosk ? "space-y-4" : "space-y-2")}>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={shopName || "Shop"} 
              className={cn(
                "rounded-2xl mx-auto mb-2 object-cover",
                isKiosk ? "w-24 h-24" : "w-16 h-16"
              )}
            />
          ) : (
            <div className={cn(
              "rounded-2xl bg-primary mx-auto flex items-center justify-center mb-2",
              isKiosk ? "w-24 h-24" : "w-16 h-16"
            )}>
              <UserCircle className={cn(isKiosk ? "w-12 h-12" : "w-8 h-8", "text-primary-foreground")} />
            </div>
          )}
          <CardTitle className={cn(isKiosk ? "text-4xl" : "text-2xl")} data-testid="text-welcome-title">
            Welcome{shopName ? ` to ${shopName}` : ""}
          </CardTitle>
          <CardDescription className={cn(isKiosk && "text-xl")}>
            Choose how you'd like to browse the menu
          </CardDescription>
          {isKiosk && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Tablet className="w-4 h-4" />
              <span>Kiosk Mode</span>
            </div>
          )}
        </CardHeader>
        <CardContent className={cn("space-y-4", isKiosk && "px-8 pb-8")}>
          <Button
            onClick={onLoginClick}
            className={cn("w-full", isKiosk && "h-20 text-xl")}
            size="lg"
            data-testid="button-login-email"
          >
            <LogIn className={cn(isKiosk ? "w-8 h-8" : "w-5 h-5", "mr-3")} />
            Login with Email
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className={cn("relative flex justify-center uppercase", isKiosk ? "text-sm" : "text-xs")}>
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            onClick={onGuestClick}
            variant="outline"
            className={cn("w-full", isKiosk && "h-20 text-xl")}
            size="lg"
            data-testid="button-browse-guest"
          >
            <Users className={cn(isKiosk ? "w-8 h-8" : "w-5 h-5", "mr-3")} />
            Browse as Guest
          </Button>

          <p className={cn("text-center text-muted-foreground pt-2", isKiosk ? "text-sm" : "text-xs")}>
            Login to save favorites. Guest browsing is limited to viewing products only.
          </p>

          {isKiosk && shopId && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground hover:underline transition-colors"
                data-testid="link-admin-access"
              >
                Admin
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {shopId && (
        <AdminAccessModal
          open={showAdminModal}
          onOpenChange={setShowAdminModal}
          shopId={shopId}
        />
      )}
    </div>
  );
}
