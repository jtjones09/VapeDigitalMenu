import { useState } from "react";
import { useLocation } from "wouter";
import { useSignIn } from "@clerk/clerk-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Loader2, ArrowLeft, Shield } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

export function AdminAccessModal({ open, onOpenChange, shopId }: AdminAccessModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setEmail("");
    setOtp("");
    setStep("email");
    setIsLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isLoaded) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/kiosk/admin-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, shopId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify email");
      }

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
        title: "Code sent",
        description: "Check your email for the verification code.",
      });
    } catch (error: any) {
      const msg = error?.errors?.[0]?.longMessage || error.message || "Email not authorized for this shop";
      toast({
        title: "Access denied",
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
          title: "Access granted",
          description: "Redirecting to admin dashboard...",
        });

        setTimeout(() => {
          onOpenChange(false);
          resetState();
          setLocation("/admin");
        }, 500);
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

  const handleBack = () => {
    setStep("email");
    setOtp("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl">
            {step === "email" ? "Admin Access" : "Enter verification code"}
          </DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Only the shop owner can access the admin dashboard"
              : `Code sent to ${email}`}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <form onSubmit={handleVerifyEmail} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Shop Owner Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 h-12"
                  data-testid="input-admin-email"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="flex-1"
                data-testid="button-cancel-admin"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isLoading || !email}
                data-testid="button-continue-admin"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Continue
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOTPChange}
                disabled={isLoading}
                data-testid="input-admin-otp"
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
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={isLoading}
                data-testid="button-back-email"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Email
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
