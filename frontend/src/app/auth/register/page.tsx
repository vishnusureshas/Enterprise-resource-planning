"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { registerUser } from "@/modules/auth/auth.api";
import { ROUTES } from "@/lib/constants";
import type { z } from "zod";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";

type RegisterForm = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const allMet = passwordRequirements.every((r) => r.test(password));
  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      setShowSuccess(true);
      toast({ title: "Account created!", variant: "success" });
      setTimeout(() => router.push(ROUTES.LOGIN), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast({ title: error?.response?.data?.error?.message || "Registration failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(59,130,246,0.12)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(168,85,247,0.12)_0%,transparent_50%)]" />
        <div className="absolute top-10 left-5 w-80 h-80 rounded-full bg-blue-200/40 blur-3xl animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-1/2 right-10 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 rounded-full bg-blue-200/30 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-purple-200/30 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/3 right-5 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="w-full max-w-md animate-slide-in-up">
        {/* Branding */}
        <Link href="/" className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 mb-8 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span>ERP<span className="text-blue-600">Admin</span></span>
        </Link>

        <Card className="bg-white/95 backdrop-blur-xl border-gray-100 shadow-xl">
          <CardHeader className="text-center pb-3">
            {showSuccess ? (
              <div className="animate-scale-in text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Welcome aboard!</CardTitle>
                <CardDescription>Redirecting to sign in...</CardDescription>
              </div>
            ) : (
              <>
                <CardTitle className="text-xl font-bold text-gray-900">Create Account</CardTitle>
                <CardDescription className="text-gray-500">Set up your organization in minutes</CardDescription>
              </>
            )}
          </CardHeader>

          {!showSuccess && (
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                    Organization Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="organizationName"
                      placeholder="Acme Corporation"
                      className="pl-10"
                      {...register("organizationName")}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input id="firstName" placeholder="John" {...register("firstName")} disabled={isSubmitting} />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" {...register("lastName")} disabled={isSubmitting} />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@acme.com"
                      className="pl-10"
                      {...register("email")}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-12"
                      {...register("password")}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}

                  {password.length > 0 && (
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all duration-300"
                          style={{
                            width: `${Math.max(20, (passwordRequirements.filter(r => r.test(password)).length / passwordRequirements.length) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle className={`w-3.5 h-3.5 ${req.test(password) ? "text-green-500" : "text-gray-300"}`} />
                            <span className={`${req.test(password) ? "text-green-600" : "text-gray-400"}`}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-12"
                      {...register("confirmPassword")}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-sm text-destructive flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> Passwords don't match</p>
                  )}
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  disabled={isSubmitting || !allMet || !passwordsMatch}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Create Account <ArrowRight className="w-5 h-5" /></span>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">Privacy</Link>
                </p>
              </form>

              <div className="mt-5 relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white/95 text-gray-500">Already have an account?</span></div>
              </div>

              <Button variant="outline" className="w-full py-2.5 text-sm font-medium" onClick={() => router.push(ROUTES.LOGIN)} disabled={isSubmitting}>
                Sign In
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      <style jsx global>{`
        @keyframes float { 0%,100%{transform:translateY(0)rotate(0deg)} 50%{transform:translateY(-20px)rotate(5deg)} }
        @keyframes slide-in-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        .animate-float{animation:float 6s ease-in-out infinite}
        .animate-slide-in-up{animation:slide-in-up 0.5s ease-out}
        .animate-scale-in{animation:scale-in 0.3s ease-out}
      `}</style>
    </div>
  );
}