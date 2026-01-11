import { z } from 'zod';

export const TextSchema = z.string().min(1, "Content cannot be empty");

export type Text = z.infer<typeof TextSchema>;