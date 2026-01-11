import { tokenUtils, tokenRepository } from "../features/token";
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req :Request, res :Response, next :NextFunction) :void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Token manquant ou invalide');
        return;
    }
    const token = authHeader.substring(7);
    const data = tokenRepository.loadData();
    const userData = data.users[token];

    if (!userData) {
        res.status(401).send('Token invalide');
        return;
    }

    const today = tokenUtils.getTodayDate();
    if(userData.lastResetDate !== today){
        userData.wordCount = 0;
        userData.lastResetDate = today;
        tokenRepository.saveData(data);
    }

    (req as any).user = userData;
    (req as any).dataStore = data;
    next();
}