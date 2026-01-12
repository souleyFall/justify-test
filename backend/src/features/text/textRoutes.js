"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextRoutes = void 0;
const express_1 = require("express");
const textController_1 = require("./textController");
const token_1 = require("../../middlewares/token");
const textRouter = (0, express_1.Router)();
exports.TextRoutes = textRouter;
textRouter.post("/justify", token_1.authMiddleware, textController_1.textController.justify);
