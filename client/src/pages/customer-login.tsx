import { useState } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function CustomerLoginPage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const redirectUrl = new URLSearchParams(searchParams).get("redirect") || "/";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isLoading, setIsLoading] = useState(false);

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
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error) throw error;

      await queryClient.invalidateQueries();

      toast({
        title: "Welcome!",
        description: "You've successfully signed in.",
      });
      
      setTimeout(() => {
        setLocation(redirectUrl);
      }, 100);
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: error.message || "Please check your code and try again",
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
        <Button variant="ghost" size="sm" className="absolute top-4 left-4" asChild data-testid="button-back">
          <Link href={redirectUrl}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <CardHeader className="text-center space-y-2 pt-12">
          <CardTitle className="text-2xl font-bold">Customer Sign In</CardTitle>
          <CardDescription>
            {step === "email" 
              ? "Enter your email to access your favorites and preferences"
              : "Enter the verification code sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
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
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
