import path from "node:path";
import { DataStore, DataStoreSchema } from "../user/userTypes";
import fs from 'fs';

class TokenRepository {
    private DATA_FILE = path.join(__dirname, 'data.json');
    
    public loadData(): DataStore {
        try{
            if(fs.existsSync(this.DATA_FILE)){
                const fileContent = fs.readFileSync(this.DATA_FILE, 'utf-8');
                const rawData = JSON.parse(fileContent);
                return DataStoreSchema.parse(rawData);
            }
        } catch(error){
            console.error('Erreur lors du chargement des données:', error);
        }
        return { users: {} };
    }

    public saveData(data: DataStore): void {
        try{
            const validatedData = DataStoreSchema.parse(data);
            fs.writeFileSync(this.DATA_FILE, JSON.stringify(validatedData, null, 2), 'utf-8');
        } catch(error){
            console.error('Erreur lors de la sauvegarde des données:', error);
        }
    }
}

export const tokenRepository = new TokenRepository();