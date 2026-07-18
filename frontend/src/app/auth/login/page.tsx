"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import type { z } from "zod";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    const result = await login(data);
    if (result.success) {
      toast({ title: "Welcome back!", variant: "success" });
      router.push(ROUTES.DASHBOARD);
    } else {
      toast({ title: result.error || "Login failed", variant: "destructive" });
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
            <CardTitle className="text-xl font-bold text-gray-900">Sign In</CardTitle>
            <CardDescription className="text-gray-500">Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
                </div>
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
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register("rememberMe")}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal text-gray-600 cursor-pointer">Remember me</Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">Sign In <ArrowRight className="w-5 h-5" /></span>
                )}
              </Button>
            </form>

            <div className="mt-5 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white/95 text-gray-500">Don't have an account?</span></div>
            </div>

            <Button variant="outline" className="w-full py-2.5 text-sm font-medium" onClick={() => router.push(ROUTES.REGISTER)} disabled={isSubmitting}>
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes float { 0%,100%{transform:translateY(0)rotate(0deg)} 50%{transform:translateY(-20px)rotate(5deg)} }
        @keyframes slide-in-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .animate-float{animation:float 6s ease-in-out infinite}
        .animate-slide-in-up{animation:slide-in-up 0.5s ease-out}
      `}</style>
    </div>
  );
}