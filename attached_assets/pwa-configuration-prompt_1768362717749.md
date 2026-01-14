# PWA CONFIGURATION - REPLIT AGENT PROMPT

## ⚠️ CRITICAL SAFETY RULES

**DO NOT:**
- ❌ Delete or modify existing routes
- ❌ Change the build configuration unnecessarily
- ❌ Modify existing component functionality
- ❌ Remove any existing files

**DO:**
- ✅ ADD new PWA files (manifest.json, service worker)
- ✅ UPDATE existing files to register PWA
- ✅ ADD offline functionality
- ✅ ADD fullscreen support for kiosk mode

---

## 📋 YOUR TASK

Make VapeMenu a fully functional Progressive Web App (PWA) with:
1. Installable on mobile/tablet/desktop
2. Offline caching for menu pages
3. Fullscreen mode for kiosk
4. Service worker for offline support
5. Install prompts

---

## 🎯 PART 1: CREATE MANIFEST.JSON

**Create file:** `/client/public/manifest.json`

```json
{
  "name": "VapeMenu - Digital Menu Platform",
  "short_name": "VapeMenu",
  "description": "Digital menu platform for vape shops",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Admin Portal",
      "short_name": "Admin",
      "description": "Manage your shop menu",
      "url": "/admin",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["business", "productivity"],
  "screenshots": [],
  "share_target": {
    "action": "/",
    "method": "GET",
    "enctype": "application/x-www-form-urlencoded"
  }
}
```

---

## 🖼️ PART 2: CREATE PLACEHOLDER ICONS

**Create directory:** `/client/public/icons/`

For now, create a simple script to generate placeholder icons:

**Create file:** `/scripts/generate-icons.js`

```javascript
// This will generate simple colored square PNGs as placeholders
// Shop owners can replace with their actual logo later

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(process.cwd(), 'client', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // White "VM" text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VM', size / 2, size / 2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
  console.log(`✅ Generated icon-${size}x${size}.png`);
});

console.log('✅ All icons generated successfully!');
```

**Add to package.json scripts:**
```json
"scripts": {
  "generate-icons": "node scripts/generate-icons.js"
}
```

**Install canvas dependency:**
```bash
npm install canvas --save-dev
```

**Run it:**
```bash
npm run generate-icons
```

---

## 🔧 PART 3: CREATE SERVICE WORKER

**Create file:** `/client/public/sw.js`

```javascript
const CACHE_NAME = 'vapemenu-v1';
const urlsToCache = [
  '/',
  '/admin',
  '/login',
  '/signup',
  // Add more static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache API responses and images
          if (
            event.request.url.includes('/api/') ||
            event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)
          ) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        }).catch(() => {
          // Network failed, show offline page if available
          return caches.match('/offline.html');
        });
      })
  );
});

// Background sync for favorites (optional enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  // Placeholder for syncing favorites when back online
  console.log('Syncing favorites...');
}
```

---

## 📱 PART 4: REGISTER SERVICE WORKER IN APP

**Update file:** `/client/src/main.tsx`

**ADD this code BEFORE** `ReactDOM.createRoot`:

```typescript
// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Existing ReactDOM.createRoot code...
```

---

## 🌐 PART 5: ADD MANIFEST LINK TO HTML

**Update file:** `/client/index.html`

**ADD these lines in the `<head>` section:**

```html
<head>
  <!-- Existing meta tags... -->
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Theme color for mobile browsers -->
  <meta name="theme-color" content="#000000">
  
  <!-- Apple Touch Icon -->
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  
  <!-- iOS specific meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="VapeMenu">
  
  <!-- Existing title, etc... -->
</head>
```

---

## 📲 PART 6: CREATE INSTALL PROMPT COMPONENT

**Create file:** `/client/src/components/install-prompt.tsx`

```typescript
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
    // Remember dismissal in localStorage
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      setShowInstall(false);
    }
  }, []);

  if (!showInstall || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Install VapeMenu
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
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
          <Button onClick={handleInstall} className="flex-1">
            Install
          </Button>
          <Button onClick={handleDismiss} variant="outline" className="flex-1">
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Add to App.tsx:**

```typescript
import { InstallPrompt } from "@/components/install-prompt";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <InstallPrompt /> {/* Add this line */}
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## 🖥️ PART 7: ADD FULLSCREEN SUPPORT FOR KIOSK MODE

**Update file:** `/client/src/pages/menu/index.tsx`

**ADD this hook near the top of the component:**

```typescript
import { useEffect, useCallback } from "react";

export default function Menu() {
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearch();
  const isKioskMode = new URLSearchParams(searchParams).get("mode") === "kiosk";
  
  // Fullscreen for kiosk mode
  useEffect(() => {
    if (!isKioskMode) return;

    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    };

    // Enter fullscreen on mount (user gesture required)
    const timeout = setTimeout(enterFullscreen, 1000);

    // Re-enter fullscreen if user exits
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isKioskMode) {
        setTimeout(enterFullscreen, 1000);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      // Exit fullscreen on unmount
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [isKioskMode]);

  // Rest of component...
}
```

---

## 📴 PART 8: CREATE OFFLINE INDICATOR

**Create file:** `/client/src/components/offline-indicator.tsx`

```typescript
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="fixed top-4 left-1/2 -translate-x-1/2 w-auto z-50">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may be limited.
      </AlertDescription>
    </Alert>
  );
}
```

**Add to App.tsx:**

```typescript
import { OfflineIndicator } from "@/components/offline-indicator";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <InstallPrompt />
          <OfflineIndicator /> {/* Add this line */}
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## 🎨 PART 9: CREATE OFFLINE FALLBACK PAGE

**Create file:** `/client/public/offline.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VapeMenu - Offline</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      margin: 0 0 1rem 0;
    }
    p {
      font-size: 1.25rem;
      opacity: 0.9;
    }
    .icon {
      font-size: 5rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection.</p>
    <p>Please check your connection and try again.</p>
  </div>
</body>
</html>
```

---

## ✅ TESTING CHECKLIST

After implementation, test the following:

**Desktop:**
- [ ] Visit the site in Chrome
- [ ] Check if install prompt appears in address bar
- [ ] Click install and verify it opens as standalone app
- [ ] Test offline mode (DevTools > Network > Offline)
- [ ] Verify service worker is registered (DevTools > Application > Service Workers)

**Mobile (iOS):**
- [ ] Open site in Safari
- [ ] Tap Share button > Add to Home Screen
- [ ] Verify icon appears on home screen
- [ ] Open from home screen - should open fullscreen
- [ ] Test offline mode (airplane mode)

**Tablet (Kiosk Mode):**
- [ ] Navigate to `/menu/:shopId?mode=kiosk`
- [ ] Verify fullscreen mode triggers
- [ ] Test that exiting fullscreen re-triggers it
- [ ] Verify install prompt appears
- [ ] Install and test kiosk mode from home screen

**Service Worker:**
- [ ] DevTools > Application > Service Workers shows active worker
- [ ] DevTools > Application > Cache Storage shows cached assets
- [ ] Network tab shows cached requests (from ServiceWorker)
- [ ] Offline mode serves cached pages

---

## 🚀 DEPLOYMENT NOTES

**Vite Configuration:**
Make sure `/vite.config.ts` includes:

```typescript
export default defineConfig({
  // ... existing config
  build: {
    // Ensure service worker is copied to dist
    rollupOptions: {
      input: {
        main: '/index.html',
        sw: '/sw.js'
      }
    }
  }
});
```

**Replit Deployment:**
- Manifest and service worker will be served from `/client/public/`
- Icons will be available at `/icons/icon-*.png`
- Service worker will cache API responses automatically

---

## 📊 EXPECTED OUTCOME

After completing this prompt:
- ✅ PWA manifest configured
- ✅ Service worker registered and caching
- ✅ Icons generated (placeholder, can be replaced)
- ✅ Install prompts working on desktop/mobile
- ✅ Fullscreen mode in kiosk
- ✅ Offline indicator shows when disconnected
- ✅ Offline fallback page
- ✅ App installable on all platforms

**Lighthouse PWA Score:** Should be 90+ after implementation.

Good luck! Remember: DO NOT delete or modify existing functionality.
