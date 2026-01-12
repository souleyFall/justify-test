import z from "zod";

export const UserSchema = z.object({
  email: z.email(),
  token: z.string(),
  wordCount: z.number().int().min(0),
  lastResetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const DataStoreSchema = z.object({
  users: z.record(z.string(), UserSchema)
});

export type User = z.infer<typeof UserSchema>;
export type DataStore = z.infer<typeof DataStoreSchema>;