import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Loader2, ArrowLeft, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface CustomerFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  agreedToTerms: boolean;
}

export default function CustomerLoginPage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const redirectUrl = new URLSearchParams(searchParams).get("redirect") || "/";
  const { toast } = useToast();
  
  const [step, setStep] = useState<"email" | "verify" | "signup">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    agreedToTerms: false,
  });

  const handleInputChange = (field: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
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
        email,
        token: code,
        type: "email",
      });

      if (verifyError) throw verifyError;

      const token = data.session?.access_token;
      if (!token) {
        throw new Error("Failed to get authentication token");
      }
      
      setAccessToken(token);

      // Check if customer profile already exists
      const checkRes = await fetch("/api/customers/me", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      
      if (checkRes.status === 404) {
        // New customer - show signup form
        setStep("signup");
        setIsLoading(false);
      } else {
        // Existing customer - go to menu
        await queryClient.invalidateQueries();
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        setTimeout(() => {
          setLocation(redirectUrl);
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
      setOtp("");
      setIsLoading(false);
    }
  };

  const handleOTPChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      handleVerifyOTP(value);
    }
  };

  const calculateAge = (dob: string): number => {
    const parts = dob.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    if (age < 18) {
      toast({
        title: "Age Requirement",
        description: "You must be 18 or older to create an account.",
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
      await apiRequest("POST", "/api/customers/verify-age", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
      }, accessToken!);

      await queryClient.invalidateQueries();

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
      
      setTimeout(() => {
        setLocation(redirectUrl);
      }, 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative">
        <Button variant="ghost" size="sm" className="absolute top-4 left-4" asChild data-testid="button-back">
          <Link href={redirectUrl}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        
        {step === "email" && (
          <>
            <CardHeader className="text-center space-y-2 pt-12">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Sign In / Sign Up</CardTitle>
              <CardDescription>
                Enter your email to sign in or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                      disabled={isLoading}
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-continue">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === "verify" && (
          <>
            <CardHeader className="text-center space-y-2 pt-12">
              <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
              <CardDescription>
                Enter the verification code sent to your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={handleOTPChange}
                      maxLength={6}
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
                  <p className="text-sm text-muted-foreground text-center">
                    We sent a code to {email}
                  </p>
                </div>
                
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                )}

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                    }}
                    disabled={isLoading}
                    data-testid="button-change-email"
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === "signup" && (
          <>
            <CardHeader className="text-center space-y-2 pt-12">
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription>
                Just a few more details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{email}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange("firstName")}
                      required
                      disabled={isLoading}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange("lastName")}
                      required
                      disabled={isLoading}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    max={maxDateString}
                    value={formData.dateOfBirth}
                    onChange={handleInputChange("dateOfBirth")}
                    required
                    disabled={isLoading}
                    data-testid="input-date-of-birth"
                  />
                  <p className="text-xs text-muted-foreground">
                    You must be 18 or older to create an account
                  </p>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, agreedToTerms: checked === true }))
                    }
                    disabled={isLoading}
                    data-testid="checkbox-terms"
                  />
                  <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    I confirm I am 18 years or older and agree to the{" "}
                    <span className="text-primary hover:underline">Terms and Conditions</span>
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-create-account">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
