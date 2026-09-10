import { boundedString, z } from './common';

export const createMessageSchema = z.object({
  body: boundedString(1, 4000),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
