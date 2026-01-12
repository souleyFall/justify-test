import request from "supertest";
import app  from "../index";
import { textUtils } from "../src/features/text";
import { text } from "node:stream/consumers";

let token: string;

describe('Test justify API', () => {

    it('Test génération token avec nouvel email', async () => {
        const response = await request(app)
            .post('/api/token')
            .send({ email: 'test@example.com' });
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        token = response.body.token;
    });

    it('Test génération token avec email déjà enregistré', async () => {
        const response = await request(app)
            .post('/api/token')
            .send({ email: 'test@test.com' });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
    });

    it('Test appel API justify sans token', async () => {
        const response = await request(app)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .send('Hello TicTacTrip, ceci est un texte à justifier.');
        
        expect(response.status).toBe(401);
        expect(response.text).toBe('Token manquant ou invalide');
    });

    it('Test appel API justify avec token invalide', async () => {
        const response = await request(app)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .set('Authorization', 'Bearer token_invalide')
            .send('Hello TicTacTrip, ceci est encore un texte à justifier.');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Token invalide');
    });

    it('Test appel API justify avec token valide', async () => {
        const text = 'Hello TicTacTrip, ceci est encore un autre texte à justifier.';
        const response = await request(app)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .set('Authorization', `Bearer ${token}`)
            .send(text);

        expect(response.status).toBe(200);
        expect(response.text).toContain('TicTacTrip');
        expect(response.text.length).toBeGreaterThanOrEqual(text.length);
    });

    it('Test limite quotidienne de mots', async () => {
        const longText = Array(80001).fill('mot').join(' ');
        const response = await request(app)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .set('Authorization', `Bearer ${token}`)
            .send(longText);
        expect(response.status).toBe(402);
    });
});

describe('Test TextUtils', () => {
    it('test compte nombre de mots', () => {
        expect(textUtils.countWords("Hello world!")).toBe(2);
        expect(textUtils.countWords("   Plusieurs    espaces   entre les mots   ")).toBe(5);
        expect(textUtils.countWords("")).toBe(0);
        expect(textUtils.countWords("     ")).toBe(0);
    });

    it('test justification d une ligne', () => {
        const line = (textUtils as any).justifyLine(["Hello", "world!"]);
        expect(line.length).toBeLessThanOrEqual(80);
        expect(line.includes("Hello")).toBe(true);
        expect(line.includes("world!")).toBe(true);
    });

    it('test justification de texte', () => {
        const text = "Hello world! Ceci est un texte de test pour la justification. Nous allons vérifier que le texte est correctement justifié sur plusieurs lignes.";
        const justifiedText = textUtils.justifyText(text);
        const lines = justifiedText.split("\n");

        for(let i = 0; i < lines.length - 1; i++){
            expect(lines[i].length).toBe(80);
        }
        expect(lines[lines.length - 1].length).toBeLessThanOrEqual(80);
    });
});