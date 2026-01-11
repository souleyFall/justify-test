import {Router} from "express";
import { tokenController } from "./tokenController";

const tokenRouter = Router();

tokenRouter.post("/token", tokenController.generateToken);

export { tokenRouter as TokenRoutes };