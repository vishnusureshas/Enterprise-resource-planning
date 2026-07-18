"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { setupMfa, verifyMfa } from "@/modules/auth/auth.api";
import type { MfaSetupResponse } from "@/types/auth";
import { Shield, KeyRound } from "lucide-react";

export default function MfaSetupPage() {
  const [step, setStep] = useState<"start" | "qr" | "backup">("start");
  const [mfaData, setMfaData] = useState<MfaSetupResponse | null>(null);
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetup = async () => {
    setIsSubmitting(true);
    try {
      const result = await setupMfa();
      setMfaData(result);
      setStep("qr");
    } catch {
      toast({ title: "Failed to initiate MFA setup", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) return;
    setIsSubmitting(true);
    try {
      await verifyMfa(token);
      toast({ title: "MFA enabled successfully", variant: "success" });
      setStep("backup");
    } catch {
      toast({ title: "Invalid token. Try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h2>
        <p className="text-muted-foreground">Add an extra layer of security to your account</p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>MFA Setup</CardTitle>
          </div>
          <CardDescription>
            {step === "start" && "Secure your account with time-based one-time passwords"}
            {step === "qr" && "Scan this QR code with your authenticator app"}
            {step === "backup" && "Save these backup codes in a secure place"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "start" && (
            <Button onClick={handleSetup} disabled={isSubmitting}>
              {isSubmitting ? "Setting up..." : "Set up MFA"}
            </Button>
          )}
          {step === "qr" && mfaData && (
            <>
              <div className="flex justify-center">
                <img src={mfaData.qrCode} alt="QR Code" className="h-48 w-48" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Or enter this key manually: <code className="font-mono">{mfaData.secret}</code>
              </p>
              <div className="space-y-2">
                <Label htmlFor="token">Enter the 6-digit code</Label>
                <div className="flex gap-2">
                  <Input
                    id="token"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="font-mono text-center text-lg"
                  />
                  <Button onClick={handleVerify} disabled={token.length !== 6 || isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            </>
          )}
          {step === "backup" && mfaData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-warning" />
                <p className="text-sm font-medium">Backup Codes</p>
              </div>
              <div className="rounded-md border bg-muted p-4">
                {mfaData.backupCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Each code can be used only once. Store them somewhere safe.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(mfaData.backupCodes.join("\n"));
                  toast({ title: "Codes copied to clipboard", variant: "success" });
                }}
              >
                Copy codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
