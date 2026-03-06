import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSignIn } from "@clerk/clerk-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Loader2, Home } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isLoaded) return;

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
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

      setStep("verify");
      toast({
        title: "Check your email",
        description: "We've sent you a 6-digit verification code.",
      });
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

  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 6 || !isLoaded) return;

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        await queryClient.invalidateQueries();

        toast({
          title: "Welcome!",
          description: "You've successfully signed in.",
        });

        setTimeout(() => {
          setLocation("/admin");
        }, 100);
      }
    } catch (error: any) {
      const msg = error?.errors?.[0]?.longMessage || error.message || "Please check your code and try again";
      toast({
        title: "Invalid code",
        description: msg,
        variant: "destructive",
      });
      setOtp("");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative">
        <Button variant="ghost" size="sm" className="absolute top-4 left-4" asChild data-testid="button-back-home">
          <Link href="/">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
        </Button>
        <CardHeader className="text-center space-y-2 pt-12">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {step === "email" ? "Sign in to MenuBoard" : "Enter verification code"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email and we'll send you a verification code"
              : `We've sent a code to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  data-testid="input-email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-send-code">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Send verification code
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline" data-testid="link-signup">
                  Sign up
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
              <div className="text-center space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  disabled={isLoading}
                  data-testid="button-change-email"
                >
                  Use a different email
                </Button>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSendOTP}
                    disabled={isLoading}
                    data-testid="button-resend-code"
                  >
                    Resend code
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
