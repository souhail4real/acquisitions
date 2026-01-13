import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.email().max(255).toLowerCase().trim().optional(),
    password: z.string().min(6).max(128).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .strict(); // Ensures no extra fields are allowed

export const userIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, 'ID must be a valid number')
      .transform(Number),
  })
  .strict();

export const getUsersQuerySchema = z
  .object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .strict();
