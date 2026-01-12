"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const text_1 = require("../features/text");
const token_1 = require("../features/token");
function registerRoutes(app) {
    app.use('/api', text_1.TextRoutes);
    app.use('/api', token_1.TokenRoutes);
}
