import { passwordSchema } from './auth';
import { z } from './common';

/**
 * Account-level operations on `/api/v1/users/me`. Each one re-checks the
 * caller's current password: a stolen session token must not be enough to
 * change the password or delete the account.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  /** Same strength policy as registration — enforced in one place. */
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  /** Typed confirmation, so a mis-click can never delete an account. */
  confirm: z.literal('DELETE'),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
