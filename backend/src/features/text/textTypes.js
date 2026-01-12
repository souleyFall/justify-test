"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextSchema = void 0;
const zod_1 = require("zod");
exports.TextSchema = zod_1.z.string().min(1, "Content cannot be empty");
