import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Tablet, Store, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">MenuBoard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/api/login">Log In</a>
            </Button>
            <Button asChild data-testid="button-get-started">
              <a href="/api/login">Get Started <ArrowRight className="w-4 h-4 ml-1" /></a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="py-20 md:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Digital Menu Platform
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Beautiful digital menus for your shop
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Let customers browse your products on their phones via QR code or on in-store tablets. 
                  Set up in minutes, no tech skills required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild data-testid="button-start-free">
                    <a href="/api/login">
                      Start Free <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild data-testid="button-view-demo">
                    <a href="#how-it-works">See How It Works</a>
                  </Button>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Free forever plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Setup in 5 minutes</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square max-w-lg mx-auto bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-8 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <Card className="p-4 hover-elevate">
                      <div className="aspect-square bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </Card>
                    <Card className="p-4 hover-elevate">
                      <div className="aspect-square bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </Card>
                    <Card className="p-4 hover-elevate">
                      <div className="aspect-square bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </Card>
                    <Card className="p-4 hover-elevate">
                      <div className="aspect-square bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A complete digital menu solution designed for retail shops
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 hover-elevate">
                <CardContent className="p-0 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">QR Code Access</h3>
                  <p className="text-muted-foreground">
                    Customers scan a QR code to browse your menu on their phones. 
                    No app download required.
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6 hover-elevate">
                <CardContent className="p-0 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tablet className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Kiosk Mode</h3>
                  <p className="text-muted-foreground">
                    Set up tablets as in-store kiosks with auto-logout and 
                    staff reset features.
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6 hover-elevate">
                <CardContent className="p-0 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Product Catalog</h3>
                  <p className="text-muted-foreground">
                    Choose from hundreds of pre-loaded products or add your own. 
                    Organize with drag-and-drop.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get your digital menu up and running in just a few steps
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Sign Up", desc: "Create your account with email" },
                { step: "2", title: "Add Products", desc: "Select from our catalog or add custom items" },
                { step: "3", title: "Customize", desc: "Upload your logo and arrange products" },
                { step: "4", title: "Share", desc: "Print QR codes or set up tablets" },
              ].map((item, i) => (
                <div key={i} className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to modernize your shop?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join thousands of shop owners using MenuBoard to create beautiful digital menus.
            </p>
            <Button size="lg" variant="secondary" asChild data-testid="button-cta-signup">
              <a href="/api/login">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </section>

        <footer className="py-8 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <QrCode className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">MenuBoard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MenuBoard. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
