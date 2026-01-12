"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const text_1 = require("../src/features/text");
let token;
describe('Test justify API', () => {
    it('Test génération token avec nouvel email', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/token')
            .send({ email: 'test@example.com' });
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        token = response.body.token;
    }));
    it('Test génération token avec email déjà enregistré', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/token')
            .send({ email: 'foo@bar.com' });
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
    }));
    it('Test appel API justify sans token', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .send('Hello TicTacTrip, ceci est un texte à justifier.');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Token manquant ou invalide');
    }));
    it('Test appel API justify avec token invalide', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .set('Authorization', 'Bearer token_invalide')
            .send('Hello TicTacTrip, ceci est encore un texte à justifier.');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Token invalide');
    }));
    it('Test appel API justify avec token valide', () => __awaiter(void 0, void 0, void 0, function* () {
        const text = 'Hello TicTacTrip, ceci est encore un autre texte à justifier.';
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .set('Authorization', `Bearer ${token}`)
            .send(text);
        expect(response.status).toBe(200);
        expect(response.text).toContain('TicTacTrip');
        expect(response.text.length).toBeGreaterThanOrEqual(text.length);
    }));
    it('Test limite quotidienne de mots', () => __awaiter(void 0, void 0, void 0, function* () {
        const longText = Array(80001).fill('mot').join(' ');
        const response = yield (0, supertest_1.default)(index_1.default)
            .post('/api/justify')
            .set('Content-Type', 'text/plain')
            .set('Authorization', `Bearer ${token}`)
            .send(longText);
        expect(response.status).toBe(402);
    }));
});
describe('Test TextUtils', () => {
    it('test compte nombre de mots', () => {
        expect(text_1.textUtils.countWords("Hello world!")).toBe(2);
        expect(text_1.textUtils.countWords("   Plusieurs    espaces   entre les mots   ")).toBe(5);
        expect(text_1.textUtils.countWords("")).toBe(0);
        expect(text_1.textUtils.countWords("     ")).toBe(0);
    });
    it('test justification d une ligne', () => {
        const line = text_1.textUtils.justifyLine(["Hello", "world!"]);
        expect(line.length).toBeLessThanOrEqual(80);
        expect(line.includes("Hello")).toBe(true);
        expect(line.includes("world!")).toBe(true);
    });
    it('test justification de texte', () => {
        const text = "Hello world! Ceci est un texte de test pour la justification. Nous allons vérifier que le texte est correctement justifié sur plusieurs lignes.";
        const justifiedText = text_1.textUtils.justifyText(text);
        const lines = justifiedText.split("\n");
        for (let i = 0; i < lines.length - 1; i++) {
            expect(lines[i].length).toBe(80);
        }
        expect(lines[lines.length - 1].length).toBeLessThanOrEqual(80);
    });
});
