import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .refine((value) => /[A-Za-z]/.test(value), 'Password must include at least one letter')
  .refine((value) => /\d/.test(value), 'Password must include at least one digit');

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
