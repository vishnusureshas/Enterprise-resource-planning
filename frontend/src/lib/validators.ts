import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Must contain uppercase, lowercase, number, and special character",
  );

export const registerSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(1).max(255).trim(),
    lastName: z.string().min(1).max(255).trim(),
    organizationName: z.string().min(1).max(255),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(255).trim().optional(),
  lastName: z.string().min(1).max(255).trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url()
    .max(500)
    .optional()
    .or(z.literal("")),
});
