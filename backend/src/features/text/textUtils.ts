import { Text } from "./textTypes";

class TextUtils {

    private readonly MAX :number = 80;

    public justifyText(text: Text): Text {
        const wordsList :Text[] = text.trim().split(/\s+/);
        const lines :Text[] = [];
        let currentLine :Text[] = [];
        let currentLineLength :number = 0;
        for(const word of wordsList){
            if(currentLineLength + word.length + currentLine.length <= this.MAX){
                currentLine.push(word);
                currentLineLength += word.length;
            } else {
                lines.push(this.justifyLine(currentLine));
                currentLine = [word];
                currentLineLength = word.length;
            }
        }

        if(currentLine.length > 0){
            lines.push(currentLine.join(" "));
        }
        
        return lines.join("\n");
    }

    private justifyLine(words: Text[]) :Text {
        const lettersLength :number = words.join("").length;
        const missedSpaces :number = this.MAX - lettersLength;
        
        if(words.length === 1){
            /**
             * au cas où le premier mot est assez grand pour ne pas laisser 
             * de place pour les autres.
             * ce qui est fortement improbable avec une taille max à 80
             * maiiiis on sait jamais.
             */
            return words[0] + " ".repeat(missedSpaces);
        }
        const gaps :number = words.length - 1;
        const spacesPerGap :number = Math.floor(missedSpaces / gaps);
        let extraSpaces :number = missedSpaces % gaps;
        
        let line :Text = "";
        for(let i = 0; i < words.length; i++){
            line += words[i];
            if(i < gaps){
                line += " ".repeat(spacesPerGap);
                if(extraSpaces > 0){
                    line += " ";
                    extraSpaces--;
                }
            }
        }
        return line;
    }

    public countWords(text: string): number {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

export const textUtils = new TextUtils();