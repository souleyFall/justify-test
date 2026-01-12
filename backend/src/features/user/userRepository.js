"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const node_path_1 = __importDefault(require("node:path"));
const userTypes_1 = require("../user/userTypes");
const fs_1 = __importDefault(require("fs"));
class UserRepository {
    constructor() {
        this.DATA_FILE = node_path_1.default.join(__dirname, 'data.json');
    }
    loadData() {
        try {
            if (fs_1.default.existsSync(this.DATA_FILE)) {
                const fileContent = fs_1.default.readFileSync(this.DATA_FILE, 'utf-8');
                const rawData = JSON.parse(fileContent);
                return userTypes_1.DataStoreSchema.parse(rawData);
            }
        }
        catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
        return { users: {} };
    }
    saveData(data) {
        try {
            const validatedData = userTypes_1.DataStoreSchema.parse(data);
            fs_1.default.writeFileSync(this.DATA_FILE, JSON.stringify(validatedData, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde des données:', error);
        }
    }
}
exports.userRepository = new UserRepository();
