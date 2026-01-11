import { Router } from "express";
import { textController } from "./textController";

const textRouter = Router();

textRouter.post("/justify", textController.justify /** validation by token à faire */);

export { textRouter as TextRoutes };