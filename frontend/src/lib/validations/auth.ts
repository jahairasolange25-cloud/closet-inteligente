import { z } from 'zod';

const ADMIN_EMAIL = 'admin@closet.com';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string(),
}).superRefine((data, ctx) => {
  if (data.email !== ADMIN_EMAIL && data.password.length < 8) {
    ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 8, type: 'string', inclusive: true, message: 'Mínimo 8 caracteres', path: ['password'] });
  }
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string(),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos' }) }),
  consentAI: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.email !== ADMIN_EMAIL) {
    if (data.password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 8, type: 'string', inclusive: true, message: 'Mínimo 8 caracteres', path: ['password'] });
    }
    if (!/[A-Z]/.test(data.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.invalid_string, validation: 'regex', message: 'Debe tener al menos una mayúscula', path: ['password'] });
    }
    if (!/[a-z]/.test(data.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.invalid_string, validation: 'regex', message: 'Debe tener al menos una minúscula', path: ['password'] });
    }
    if (!/[0-9]/.test(data.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.invalid_string, validation: 'regex', message: 'Debe tener al menos un número', path: ['password'] });
    }
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] });
  }
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
