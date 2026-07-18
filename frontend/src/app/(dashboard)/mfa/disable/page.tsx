"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/components/ui/use-toast";
import { disableMfa } from "@/modules/auth/auth.api";
import { ROUTES } from "@/lib/constants";
import { ShieldOff, AlertTriangle } from "lucide-react";

export default function MfaDisablePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user?.mfaEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h2>
          <p className="text-muted-foreground">MFA is not currently enabled</p>
        </div>
        <Card className="max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">You don&apos;t have MFA enabled on your account.</p>
            <Button onClick={() => router.push(ROUTES.MFA_SETUP)}>Set up MFA</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDisable = async () => {
    if (!password) return;
    setIsSubmitting(true);
    try {
      const result = await disableMfa(password);
      if (result.user) {
        setUser(result.user);
      } else {
        setUser({ ...user!, mfaEnabled: false });
      }
      toast({ title: "MFA disabled successfully", variant: "success" });
      router.push(ROUTES.PROFILE);
    } catch {
      toast({ title: "Failed to disable MFA. Check your password.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h2>
        <p className="text-muted-foreground">Disable MFA on your account</p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-destructive" />
            <CardTitle>Disable MFA</CardTitle>
          </div>
          <CardDescription>
            Your account will be less secure. Confirm your password to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              Disabling MFA removes an extra layer of security from your account. 
              We recommend keeping it enabled.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Confirm your password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={!password || isSubmitting}
            >
              {isSubmitting ? "Disabling..." : "Disable MFA"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
