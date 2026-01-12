"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const token_1 = require("../features/token");
const user_1 = require("../features/user");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Token manquant ou invalide');
        return;
    }
    const token = authHeader.substring(7);
    const data = user_1.userRepository.loadData();
    const userData = data.users[token];
    if (!userData) {
        res.status(401).send('Token invalide');
        return;
    }
    const today = token_1.tokenUtils.getTodayDate();
    if (userData.lastResetDate !== today) {
        userData.wordCount = 0;
        userData.lastResetDate = today;
        user_1.userRepository.saveData(data);
    }
    req.user = userData;
    req.dataStore = data;
    next();
}
