"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRoutes = void 0;
const express_1 = require("express");
const tokenController_1 = require("./tokenController");
const tokenRouter = (0, express_1.Router)();
exports.TokenRoutes = tokenRouter;
tokenRouter.post("/token", tokenController_1.tokenController.generateToken);
