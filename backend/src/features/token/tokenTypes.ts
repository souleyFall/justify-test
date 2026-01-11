import z from "zod";

export const TokenRequestSchema = z.object({
    email: z.email()
});

export type TokenRequest = z.infer<typeof TokenRequestSchema>;
