import { Request, Response } from "express";
import { TokenRequest, TokenRequestSchema } from "./tokenTypes";
import { tokenRepository } from "./tokenRepository";
import { tokenUtils } from "./tokenUtils";
import z from "zod";

class TokenController {
    public generateToken(req : Request, res : Response) : void {
        try {
            const { email } = TokenRequestSchema.parse(req.body);
            const data = tokenRepository.loadData();

            // Vérifier si l'utilisateur existe déjà
            let existingToken: string | null = null;
            for (const [token, userData] of Object.entries(data.users)) {
                if (userData.email === email) {
                    existingToken = token;
                    break;
                }
            }

            if(existingToken){
                res.json({ token: existingToken });
                return;
            }

            const token = tokenUtils.generateToken();
            const userData = {
                email,
                token,
                wordCount: 0,
                lastResetDate: tokenUtils.getTodayDate()
            };
            data.users[token] = userData;
            tokenRepository.saveData(data);
            res.json({ token });
        }catch (error) {
            if(error instanceof z.ZodError){
                res.status(400).json({
                    error: 'Données invalides',
                    details: error
                });
                return;
            }
        }
    }
}

export const tokenController = new TokenController();