"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.textController = void 0;
const textUtils_1 = require("./textUtils");
const user_1 = require("../user");
const zod_1 = __importDefault(require("zod"));
class TextController {
    justify(req, res) {
        try {
            const textData = req.body;
            const UserData = req.user;
            const dataStore = req.dataStore;
            if (!textData || textData.length === 0) {
                res.status(400).send("aucun texte fourni");
                return;
            }
            const wordCount = textUtils_1.textUtils.countWords(textData);
            const DAILY_LIMIT = 80000;
            if (UserData.wordCount + wordCount > DAILY_LIMIT) {
                res.status(402).send("Payment Required");
                return;
            }
            UserData.wordCount += wordCount;
            dataStore.users[UserData.token] = UserData;
            user_1.userRepository.saveData(dataStore);
            const justifiedText = textUtils_1.textUtils.justifyText(textData);
            res.setHeader("Content-Type", "text/plain");
            res.send(justifiedText);
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
exports.textController = new TextController();
