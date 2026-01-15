import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  Tablet,
  Smartphone,
  Copy,
  ExternalLink,
  Download,
  Check,
} from "lucide-react";
import { useState } from "react";
import { useShop } from "@/contexts/shop-context";

export default function Setup() {
  const { toast } = useToast();
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedKiosk, setCopiedKiosk] = useState(false);

  const { currentShop: shop, isLoading } = useShop();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const menuUrl = shop ? `${baseUrl}/menu/${shop.id}` : "";
  const kioskUrl = shop ? `${baseUrl}/menu/${shop.id}?mode=kiosk` : "";
  const qrCodeUrl = shop ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}` : "";

  const copyToClipboard = async (text: string, type: "qr" | "kiosk") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "qr") {
        setCopiedQr(true);
        setTimeout(() => setCopiedQr(false), 2000);
      } else {
        setCopiedKiosk(true);
        setTimeout(() => setCopiedKiosk(false), 2000);
      }
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-setup-title">Setup</h1>
          <p className="text-muted-foreground mt-1">
            Get your QR code and kiosk URL to share with customers
          </p>
        </div>

        <Tabs defaultValue="qr" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="qr" className="gap-2" data-testid="tab-qr">
              <Smartphone className="w-4 h-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="kiosk" className="gap-2" data-testid="tab-kiosk">
              <Tablet className="w-4 h-4" />
              Kiosk Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Your QR Code
                  </CardTitle>
                  <CardDescription>
                    Customers scan this to browse your menu on their phones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="w-[300px] h-[300px] mx-auto" />
                  ) : shop ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-white rounded-xl border">
                        <img
                          src={qrCodeUrl}
                          alt="QR Code for your menu"
                          className="w-[250px] h-[250px]"
                          data-testid="img-qr-code"
                        />
                      </div>
                      <p className="text-center text-sm text-muted-foreground max-w-xs">
                        Print this QR code and display it at your counter for customers to scan
                      </p>
                      <div className="flex gap-3">
                        <Button variant="outline" asChild data-testid="button-download-qr">
                          <a href={qrCodeUrl} download={`${shop.shopName}-qr-code.png`}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                        <Button variant="outline" asChild data-testid="button-preview-menu">
                          <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Preview
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Complete your shop setup to get your QR code
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Menu URL</CardTitle>
                  <CardDescription>
                    Direct link to your digital menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={menuUrl}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-menu-url"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(menuUrl, "qr")}
                      data-testid="button-copy-menu-url"
                    >
                      {copiedQr ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <h4 className="font-medium">How it works:</h4>
                    <ol className="space-y-2 text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="font-medium text-foreground">1.</span>
                        Customer scans the QR code with their phone
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-foreground">2.</span>
                        Menu opens in their browser - no app needed
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-foreground">3.</span>
                        They can browse products and save favorites
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium text-foreground">4.</span>
                        Show their phone to staff to purchase
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kiosk" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tablet className="w-5 h-5" />
                    Kiosk Mode URL
                  </CardTitle>
                  <CardDescription>
                    Use this URL on in-store tablets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={kioskUrl}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-kiosk-url"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(kioskUrl, "kiosk")}
                      data-testid="button-copy-kiosk-url"
                    >
                      {copiedKiosk ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild data-testid="button-open-kiosk">
                      <a href={kioskUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Kiosk Mode
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kiosk Features</CardTitle>
                  <CardDescription>
                    Special features for in-store tablets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Auto-logout</p>
                        <p className="text-muted-foreground">
                          Sessions automatically end after {shop?.kioskTimeoutMinutes || 5} minutes of inactivity
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Guest Browsing</p>
                        <p className="text-muted-foreground">
                          Customers can browse without logging in
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Staff Reset</p>
                        <p className="text-muted-foreground">
                          Quick reset button for staff to clear sessions
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
                <CardDescription>
                  How to set up kiosk mode on different devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">iPad</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li>1. Open Safari and go to the kiosk URL</li>
                      <li>2. Tap Share &rarr; Add to Home Screen</li>
                      <li>3. Go to Settings &rarr; Accessibility</li>
                      <li>4. Enable Guided Access</li>
                      <li>5. Launch the app and triple-click to start</li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Android Tablet</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li>1. Install "Kiosk Browser" from Play Store</li>
                      <li>2. Open the app and enter kiosk URL</li>
                      <li>3. Configure lockdown settings</li>
                      <li>4. Enable kiosk mode in the app</li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Windows/Mac</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li>1. Open Chrome and go to kiosk URL</li>
                      <li>2. Click "Install MenuBoard" if prompted</li>
                      <li>3. Or: Menu &rarr; Install MenuBoard</li>
                      <li>4. Launch installed app for fullscreen</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
