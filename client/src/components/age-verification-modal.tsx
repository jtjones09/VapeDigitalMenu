import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertCircle, Loader2 } from "lucide-react";
import type { Customer } from "@shared/schema";

interface AgeVerificationModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function AgeVerificationModal({ open, onSuccess }: AgeVerificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const verifyAgeMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; dateOfBirth: string }) => {
      const res = await apiRequest("POST", "/api/customers/verify-age", data);
      return await res.json() as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      toast({
        title: "Age Verified!",
        description: "Welcome! You can now browse the menu.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.message || "Failed to verify age";
      toast({
        title: "Verification Failed",
        description: message.includes("403") ? "You must be 18 or older to access this service" : message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    verifyAgeMutation.mutate({ firstName, lastName, dateOfBirth });
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            You must be 18 or older to access this service. Please provide your information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={verifyAgeMutation.isPending}
              data-testid="input-first-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={verifyAgeMutation.isPending}
              data-testid="input-last-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              max={maxDateString}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              disabled={verifyAgeMutation.isPending}
              data-testid="input-date-of-birth"
            />
            <p className="text-xs text-muted-foreground">
              You must be 18 or older to continue
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
            <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              By continuing, you confirm that you are at least 18 years of age and agree to our terms of service.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={verifyAgeMutation.isPending}
            data-testid="button-verify-age"
          >
            {verifyAgeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
