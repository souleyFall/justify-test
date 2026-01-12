"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textUtils = void 0;
class TextUtils {
    constructor() {
        this.MAX = 80;
    }
    justifyText(text) {
        const wordsList = text.trim().split(/\s+/);
        const lines = [];
        let currentLine = [];
        let currentLineLength = 0;
        for (const word of wordsList) {
            if (currentLineLength + word.length + currentLine.length <= this.MAX) {
                currentLine.push(word);
                currentLineLength += word.length;
            }
            else {
                lines.push(this.justifyLine(currentLine));
                currentLine = [word];
                currentLineLength = word.length;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine.join(" "));
        }
        return lines.join("\n");
    }
    justifyLine(words) {
        const lettersLength = words.join("").length;
        const missedSpaces = this.MAX - lettersLength;
        if (words.length === 1) {
            /**
             * au cas où le premier mot est assez grand pour ne pas laisser
             * de place pour les autres.
             * ce qui est fortement improbable avec une taille max à 80
             * maiiiis on sait jamais.
             */
            return words[0] + " ".repeat(missedSpaces);
        }
        const gaps = words.length - 1;
        const spacesPerGap = Math.floor(missedSpaces / gaps);
        let extraSpaces = missedSpaces % gaps;
        let line = "";
        for (let i = 0; i < words.length; i++) {
            line += words[i];
            if (i < gaps) {
                line += " ".repeat(spacesPerGap);
                if (extraSpaces > 0) {
                    line += " ";
                    extraSpaces--;
                }
            }
        }
        return line;
    }
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}
exports.textUtils = new TextUtils();
