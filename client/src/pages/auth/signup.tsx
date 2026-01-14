import { useState } from "react";
import { useLocation, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowRight, Loader2, ArrowLeft, Home } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface SignupData {
  email: string;
  ownerName: string;
  shopName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  agreedToTerms: boolean;
}

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    ownerName: "",
    shopName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    agreedToTerms: false,
  });

  const handleInputChange = (field: keyof SignupData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.ownerName || !formData.shopName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the Terms and Conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setStep("verify");
      toast({
        title: "Check your email",
        description: "We've sent you a 6-digit verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      const { error: verifyError, data } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: code,
        type: "email",
      });

      if (verifyError) throw verifyError;

      // Get the access token from the session
      const accessToken = data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Failed to get authentication token");
      }

      // Now create the shop with the user's ID, passing the token directly
      const shopData = {
        shopName: formData.shopName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      };

      await apiRequest("POST", "/api/shops", shopData, accessToken);
      await queryClient.invalidateQueries();

      toast({
        title: "Welcome to MenuBoard!",
        description: "Your account has been created successfully.",
      });
      
      setTimeout(() => {
        setLocation("/admin");
      }, 100);
    } catch (error: any) {
      if (error.message?.includes("Invalid") || error.message?.includes("token")) {
        toast({
          title: "Invalid code",
          description: "Please check your code and try again",
          variant: "destructive",
        });
        setOtp("");
      } else {
        toast({
          title: "Error",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      handleVerifyOTP(value);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Code resent",
        description: "Check your email for a new verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" asChild data-testid="button-back-home">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-2">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {step === "form" ? "Create your account" : "Verify your email"}
          </CardTitle>
          <CardDescription>
            {step === "form"
              ? "Tell us about yourself and your shop"
              : `We've sent a code to ${formData.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "form" ? (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  disabled={isLoading}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerName">Your name *</Label>
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="John Smith"
                  value={formData.ownerName}
                  onChange={handleInputChange("ownerName")}
                  disabled={isLoading}
                  required
                  data-testid="input-owner-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop name *</Label>
                <Input
                  id="shopName"
                  type="text"
                  placeholder="My Vape Shop"
                  value={formData.shopName}
                  onChange={handleInputChange("shopName")}
                  disabled={isLoading}
                  required
                  data-testid="input-shop-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                  disabled={isLoading}
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={handleInputChange("address")}
                  disabled={isLoading}
                  data-testid="input-address"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Los Angeles"
                    value={formData.city}
                    onChange={handleInputChange("city")}
                    disabled={isLoading}
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="CA"
                    value={formData.state}
                    onChange={handleInputChange("state")}
                    disabled={isLoading}
                    data-testid="input-state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    type="text"
                    placeholder="90001"
                    value={formData.zip}
                    onChange={handleInputChange("zip")}
                    disabled={isLoading}
                    data-testid="input-zip"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreedToTerms: checked === true }))
                  }
                  disabled={isLoading}
                  data-testid="checkbox-terms"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> *
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-create-account">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Create account
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOTPChange}
                  disabled={isLoading}
                  data-testid="input-otp"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {isLoading && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                  }}
                  disabled={isLoading}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  data-testid="button-resend-code"
                >
                  Resend code
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
