import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User ${outcome} the install prompt`);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      setShowInstall(false);
    }
  }, []);

  if (!showInstall || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg" data-testid="card-install-prompt">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Install VapeMenu
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            data-testid="button-dismiss-install"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Install this app for a better experience and offline access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={handleInstall} className="flex-1" data-testid="button-install">
            Install
          </Button>
          <Button onClick={handleDismiss} variant="outline" className="flex-1" data-testid="button-not-now">
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
