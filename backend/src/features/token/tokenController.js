"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenController = void 0;
const tokenTypes_1 = require("./tokenTypes");
const user_1 = require("../user");
const tokenUtils_1 = require("./tokenUtils");
const zod_1 = __importDefault(require("zod"));
class TokenController {
    generateToken(req, res) {
        try {
            const { email } = tokenTypes_1.TokenRequestSchema.parse(req.body);
            const data = user_1.userRepository.loadData();
            // Vérifier si l'utilisateur existe déjà
            let existingToken = null;
            for (const [token, userData] of Object.entries(data.users)) {
                if (userData.email === email) {
                    existingToken = token;
                    break;
                }
            }
            if (existingToken) {
                res.json({ token: existingToken });
                return;
            }
            const token = tokenUtils_1.tokenUtils.generateToken();
            const userData = {
                email,
                token,
                wordCount: 0,
                lastResetDate: tokenUtils_1.tokenUtils.getTodayDate()
            };
            data.users[token] = userData;
            user_1.userRepository.saveData(data);
            res.json({ token });
        }
        catch (error) {
            if (error instanceof zod_1.default.ZodError) {
                res.status(400).json({
                    error: 'Données invalides',
                    details: error
                });
                return;
            }
        }
    }
}
exports.tokenController = new TokenController();
