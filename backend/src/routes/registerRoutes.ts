
import { Router } from "express";
import { TextRoutes } from "../features/text";
import { TokenRoutes } from "../features/token";

export function registerRoutes(app :Router){
    app.use('/api', TextRoutes);
    app.use('/api', TokenRoutes);
}
