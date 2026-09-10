/**
 * Authentication input schemas — shared by the Expo auth forms and the Worker
 * auth routes so both enforce the exact same rules.
 */
import { boundedString, usernameSchema, z } from './common';

export { usernameSchema };

/** Normalised email: trimmed + lower-cased, RFC-ish, length-bounded. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('must be a valid email address');

/**
 * Password policy: long enough to matter, capped so a huge input cannot be
 * used to burn CPU in the KDF, and required to mix letters + digits. No
 * punctuation/upper-case mandate — that hurts UX for little gain.
 */
export const passwordSchema = z
  .string()
  .min(10, 'must be at least 10 characters')
  .max(128, 'must be at most 128 characters')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: 'must contain at least one letter and one number',
  });

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: boundedString(1, 80),
  username: usernameSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // Only bounded here — never apply the strength policy to a login attempt.
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;
