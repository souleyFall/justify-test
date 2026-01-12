import { Text } from "./textTypes";
import { Request, Response } from "express";
import { textUtils } from "./textUtils";
import { userRepository } from "../user";
import z from "zod";

class TextController {
    public justify(req : Request, res : Response) : void {
        try {
            const textData: Text = req.body;
            const UserData = (req as any).user;
            const dataStore = (req as any).dataStore;
    
            if(!textData || textData.length === 0) {
                res.status(400).send("aucun texte fourni");
                return;
            }
    
            const wordCount = textUtils.countWords(textData);
            const DAILY_LIMIT = 80000;
    
            if(UserData.wordCount + wordCount > DAILY_LIMIT){
                res.status(402).send("Payment Required");
                return;
            }
    
            UserData.wordCount += wordCount;
            dataStore.users[UserData.token] = UserData;
            userRepository.saveData(dataStore);
    
            const justifiedText: Text = textUtils.justifyText(textData);
            res.setHeader("Content-Type", "text/plain");
            res.send(justifiedText);
        }catch (error) {
            if(error instanceof z.ZodError){
                res.status(400).json({
                    error: 'Données invalides',
                    details: error
                });
                return;
            }
        }
    } 
}

export const textController = new TextController();