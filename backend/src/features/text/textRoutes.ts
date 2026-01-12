import { Router } from "express";
import { textController } from "./textController";
import { authMiddleware } from "../../middlewares/token";

const textRouter = Router();

textRouter.post("/justify", authMiddleware, textController.justify);

export { textRouter as TextRoutes };