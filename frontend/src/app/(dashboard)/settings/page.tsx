"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import { getOrgSettings, updateOrgSettings } from "@/modules/organizations/org.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Mail, Shield, Bell, Globe, Save } from "lucide-react";
import type { OrgSettings } from "@/modules/organizations/org.api";

type SettingsSection = "email" | "security" | "notifications" | "localization";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<SettingsSection | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: CACHE_KEYS.ORG_SETTINGS,
    queryFn: getOrgSettings,
  });

  const [localSettings, setLocalSettings] = useState<OrgSettings | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<OrgSettings>) =>
      updateOrgSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORG_SETTINGS });
      toast({ title: "Settings saved", variant: "success" });
      setSaving(null);
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
      setSaving(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const s = localSettings || settings;

  const handleSave = (data: Partial<OrgSettings>) => {
    setSaving(Object.keys(data)[0] as SettingsSection);
    updateMutation.mutate(data);
  };

  if (!s) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage organization-wide configuration</p>
      </div>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP settings for transactional emails</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={s.email.host || ""}
                onChange={(e) => setLocalSettings({ ...s, email: { ...s.email, host: e.target.value } })}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                type="number"
                value={s.email.port}
                onChange={(e) => setLocalSettings({ ...s, email: { ...s.email, port: parseInt(e.target.value) || 587 } })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input
                value={s.email.user || ""}
                onChange={(e) => setLocalSettings({ ...s, email: { ...s.email, user: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                value={s.email.pass || ""}
                onChange={(e) => setLocalSettings({ ...s, email: { ...s.email, pass: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={s.email.fromName || ""}
                onChange={(e) => setLocalSettings({ ...s, email: { ...s.email, fromName: e.target.value } })}
                placeholder="ERP Admin"
              />
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                value={s.email.fromEmail || ""}
                onChange={(e) => setLocalSettings({ ...s, email: { ...s.email, fromEmail: e.target.value } })}
                placeholder="noreply@example.com"
              />
            </div>
          </div>
          <Button onClick={() => handleSave({ email: s.email })} disabled={saving === "email"}>
            <Save className="mr-2 h-4 w-4" /> {saving === "email" ? "Saving..." : "Save Email Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Password policies and session settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum Password Length</Label>
              <Input
                type="number"
                value={s.security.passwordMinLength}
                onChange={(e) => setLocalSettings({ ...s, security: { ...s.security, passwordMinLength: parseInt(e.target.value) || 8 } })}
              />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={s.security.sessionTimeoutMinutes}
                onChange={(e) => setLocalSettings({ ...s, security: { ...s.security, sessionTimeoutMinutes: parseInt(e.target.value) || 480 } })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <Input
                type="number"
                value={s.security.maxLoginAttempts}
                onChange={(e) => setLocalSettings({ ...s, security: { ...s.security, maxLoginAttempts: parseInt(e.target.value) || 5 } })}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Require special character</Label>
              <Switch
                checked={s.security.passwordRequireSpecial}
                onCheckedChange={(v) => setLocalSettings({ ...s, security: { ...s.security, passwordRequireSpecial: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require number</Label>
              <Switch
                checked={s.security.passwordRequireNumber}
                onCheckedChange={(v) => setLocalSettings({ ...s, security: { ...s.security, passwordRequireNumber: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require uppercase letter</Label>
              <Switch
                checked={s.security.passwordRequireUpper}
                onCheckedChange={(v) => setLocalSettings({ ...s, security: { ...s.security, passwordRequireUpper: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require MFA for all users</Label>
              <Switch
                checked={s.security.mfaRequired}
                onCheckedChange={(v) => setLocalSettings({ ...s, security: { ...s.security, mfaRequired: v } })}
              />
            </div>
          </div>
          <Button onClick={() => handleSave({ security: s.security })} disabled={saving === "security"}>
            <Save className="mr-2 h-4 w-4" /> {saving === "security" ? "Saving..." : "Save Security Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Email notifications</Label>
            <Switch
              checked={s.notifications.emailNotifications}
              onCheckedChange={(v) => setLocalSettings({ ...s, notifications: { ...s.notifications, emailNotifications: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>In-app notifications</Label>
            <Switch
              checked={s.notifications.inAppNotifications}
              onCheckedChange={(v) => setLocalSettings({ ...s, notifications: { ...s.notifications, inAppNotifications: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Weekly digest email</Label>
            <Switch
              checked={s.notifications.weeklyDigest}
              onCheckedChange={(v) => setLocalSettings({ ...s, notifications: { ...s.notifications, weeklyDigest: v } })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>Order confirmation</Label>
            <Switch
              checked={s.notifications.orderConfirmation}
              onCheckedChange={(v) => setLocalSettings({ ...s, notifications: { ...s.notifications, orderConfirmation: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Password change alert</Label>
            <Switch
              checked={s.notifications.passwordChangeAlert}
              onCheckedChange={(v) => setLocalSettings({ ...s, notifications: { ...s.notifications, passwordChangeAlert: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Login alert</Label>
            <Switch
              checked={s.notifications.loginAlert}
              onCheckedChange={(v) => setLocalSettings({ ...s, notifications: { ...s.notifications, loginAlert: v } })}
            />
          </div>
          <Button onClick={() => handleSave({ notifications: s.notifications })} disabled={saving === "notifications"}>
            <Save className="mr-2 h-4 w-4" /> {saving === "notifications" ? "Saving..." : "Save Notification Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Localization Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Localization</CardTitle>
              <CardDescription>Language, date format, and regional settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Language</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={s.localization.defaultLanguage}
                onChange={(e) => setLocalSettings({ ...s, localization: { ...s.localization, defaultLanguage: e.target.value } })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={s.localization.timezone}
                onChange={(e) => setLocalSettings({ ...s, localization: { ...s.localization, timezone: e.target.value } })}
                placeholder="UTC"
              />
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={s.localization.dateFormat}
                onChange={(e) => setLocalSettings({ ...s, localization: { ...s.localization, dateFormat: e.target.value } })}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={s.localization.currency}
                onChange={(e) => setLocalSettings({ ...s, localization: { ...s.localization, currency: e.target.value.toUpperCase() } })}
                placeholder="USD"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Week starts on</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={s.localization.weekStartsOn}
                onChange={(e) => setLocalSettings({ ...s, localization: { ...s.localization, weekStartsOn: parseInt(e.target.value) } })}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
          </div>
          <Button onClick={() => handleSave({ localization: s.localization })} disabled={saving === "localization"}>
            <Save className="mr-2 h-4 w-4" /> {saving === "localization" ? "Saving..." : "Save Localization Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
