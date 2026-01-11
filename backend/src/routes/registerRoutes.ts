
import { Router } from "express";
import { TextRoutes } from "../features/text";

export function registerRoutes(app :Router){
    app.use('/api', TextRoutes);
}
