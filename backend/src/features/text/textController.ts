import { Text } from "./textTypes";
import { Request, Response } from "express";
import { textUtils } from "./textUtils";

class TextController {
    public justify(req : Request, res : Response) : void {
        const textData: Text = req.body;
        if(!textData || textData.length === 0) {
            res.status(400).send("aucun texte fourni");
            return;
        }
        const justifiedText: Text = textUtils.justifyText(textData);
        res.setHeader("Content-Type", "text/plain");
        res.send(justifiedText);
    } 
}

export const textController = new TextController();