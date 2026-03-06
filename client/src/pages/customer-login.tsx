import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-react";
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
  email: string;
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
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<"email" | "signup" | "verify">("email");
  const [isNewUser, setIsNewUser] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    email: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    agreedToTerms: false,
  });

  const handleInputChange = (field: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/customers/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (!response.ok) {
        throw new Error("Failed to check email");
      }

      const { exists } = await response.json();

      if (exists) {
        setIsNewUser(false);
        await sendSignInOTP(email);
        setStep("verify");
      } else {
        setIsNewUser(true);
        setFormData(prev => ({ ...prev, email }));
        setStep("signup");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendSignInOTP = async (emailAddress: string) => {
    if (!signInLoaded) throw new Error("Auth not ready");

    const result = await signIn.create({
      identifier: emailAddress,
    });

    const emailFactor = result.supportedFirstFactors?.find(
      (f: any) => f.strategy === "email_code"
    );

    if (!emailFactor || !("emailAddressId" in emailFactor)) {
      throw new Error("Email code verification not available");
    }

    await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: emailFactor.emailAddressId,
    });

    toast({
      title: "Check your email",
      description: "We've sent you a 6-digit verification code.",
    });
  };

  const sendSignUpOTP = async (emailAddress: string) => {
    if (!signUpLoaded) throw new Error("Auth not ready");

    await signUp.create({
      emailAddress,
    });

    await signUp.prepareEmailAddressVerification({
      strategy: "email_code",
    });

    toast({
      title: "Check your email",
      description: "We've sent you a 6-digit verification code.",
    });
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
      await sendSignUpOTP(formData.email);
      setStep("verify");
    } catch (error: any) {
      const msg = error?.errors?.[0]?.longMessage || error.message || "Failed to send verification code";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      let authComplete = false;

      if (isNewUser) {
        if (!signUpLoaded) throw new Error("Auth not ready");
        
        const result = await signUp.attemptEmailAddressVerification({ code });
        
        if (result.status === "complete" && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          
          const token = await getToken();
          if (!token) throw new Error("Failed to get authentication token");

          await apiRequest("POST", "/api/customers/verify-age", {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
          }, token);

          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
          authComplete = true;
        }
      } else {
        if (!signInLoaded) throw new Error("Auth not ready");

        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });

          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          authComplete = true;
        }
      }

      if (authComplete) {
        await queryClient.invalidateQueries();
        setTimeout(() => {
          setLocation(redirectUrl);
        }, 100);
      } else {
        setIsLoading(false);
      }
    } catch (error: any) {
      const msg = error?.errors?.[0]?.longMessage || error.message || "Please check your code and try again";
      toast({
        title: "Invalid code",
        description: msg,
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

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const currentEmail = isNewUser ? formData.email : email;

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
              <form onSubmit={handleCheckEmail} className="space-y-4">
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
                      Checking...
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

        {step === "signup" && (
          <>
            <CardHeader className="text-center space-y-2 pt-12">
              <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
              <CardDescription>
                Complete your profile to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{formData.email}</span>
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

                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-send-code">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep("email");
                      setFormData({ email: "", firstName: "", lastName: "", dateOfBirth: "", agreedToTerms: false });
                    }}
                    disabled={isLoading}
                    data-testid="button-back-to-email"
                  >
                    Use a different email
                  </Button>
                </div>
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
                    We sent a code to {currentEmail}
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
                      setEmail("");
                      setFormData({ email: "", firstName: "", lastName: "", dateOfBirth: "", agreedToTerms: false });
                      setIsNewUser(false);
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
      </Card>
    </div>
  );
}
