"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStoreSchema = exports.UserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.UserSchema = zod_1.default.object({
    email: zod_1.default.email(),
    token: zod_1.default.string(),
    wordCount: zod_1.default.number().int().min(0),
    lastResetDate: zod_1.default.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
exports.DataStoreSchema = zod_1.default.object({
    users: zod_1.default.record(zod_1.default.string(), exports.UserSchema)
});
