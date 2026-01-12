# Justify API - Documentation Technique Complète

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Routes API](#routes-api)
4. [Authentification](#authentification)
5. [Schémas de données](#schémas-de-données)
6. [Codes de réponse HTTP](#codes-de-réponse-http)
7. [Exemples de requêtes](#exemples-de-requêtes)
8. [Limites et quotas](#limites-et-quotas)

---

## Vue d'ensemble

**Justify** est une API REST qui fournit des services de justification de texte et de gestion de tokens utilisateur. L'API utilise une validation de schéma stricte avec Zod et implémente un système d'authentification par Bearer Token.

- **Version**: 1.0.0
- **Port par défaut**: 3000
- **Préfixe des routes**: `/api`
- **Format de réponse**: JSON (sauf pour `/api/justify` qui retourne du texte brut)

---

## Architecture

### Structure du projet

```
backend/
├── src/
│   ├── features/
│   │   ├── text/          # Fonctionnalité de justification de texte
│   │   ├── token/         # Génération et gestion de tokens
│   │   └── user/          # Persistance et gestion des données utilisateur
│   ├── middlewares/       # Middlewares Express
│   └── routes/            # Enregistrement des routes
├── index.ts               # Point d'entrée de l'application
└── package.json
```

### Pile technologique

- **Runtime**: Node.js
- **Framework**: Express.js
- **Validation**: Zod
- **Persistance**: JSON (fichier)
- **CORS**: Activé
- **Langage**: TypeScript

---

## Routes API

### 1. POST `/api/token` - Génération de token

Génère ou récupère un token d'authentification pour un utilisateur identifié par son email.

#### Détails

| Propriété | Valeur |
|-----------|--------|
| **Méthode HTTP** | POST |
| **Authentification requise** | Non |
| **Content-Type** | application/json |
| **Limite de taille** | S/O |

#### Paramètres de requête

```json
{
  "email": "user@example.com"
}
```

| Paramètre | Type | Requis | Validation |
|-----------|------|--------|------------|
| `email` | string | Oui | Email valide (RFC 5322) |

#### Réponse (200 OK)

```json
{
  "token": "a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0"
}
```

#### Comportement

- **Premier appel avec cet email**: Crée un nouvel utilisateur avec:
  - Un token unique généré aléatoirement (32 caractères alphanumériques)
  - Compteur de mots = 0
  - Date de reset du quota = aujourd'hui
  
- **Appels suivants avec le même email**: Retourne le token existant (permet la réutilisation de l'authentification)

#### Cas d'erreur

| Code | Message | Cause |
|------|---------|-------|
| **400** | Données invalides | Email invalide ou manquant |

---

### 2. POST `/api/justify` - Justification de texte

Justifie un texte fourni en l'alignant sur une largeur de 80 caractères.

#### Détails

| Propriété | Valeur |
|-----------|--------|
| **Méthode HTTP** | POST |
| **Authentification requise** | Oui (Bearer Token) |
| **Content-Type** | text/plain |
| **Limite de taille** | 5 MB |

#### Headers requis

```
Authorization: Bearer <token>
Content-Type: text/plain
```

#### Corps de la requête

Texte brut à justifier (minimum 1 caractère)

```
Voici un texte qui sera justifié sur une largeur de 80 caractères par l'API.
```

#### Réponse (200 OK)

```
Content-Type: text/plain
```

Texte justifié:

```
Voici un texte qui sera justifié sur une largeur de 80 caractères par  l'API.
```

#### Comportement

1. **Validation du token**: Vérification du Bearer Token via le middleware d'authentification
2. **Reset quotidien**: Si la date de reset ne correspond pas à aujourd'hui:
   - Le compteur de mots est réinitialisé à 0
   - La date de reset est mise à jour
3. **Vérification du quota**: Contrôle que `wordCount + nouveaux_mots ≤ 80000`
4. **Comptage des mots**: Utilise une simple séparation sur les espaces
5. **Justification**: Applique l'algorithme de justification (voir TextUtils)
6. **Persistance**: Sauvegarde le nouvel état de l'utilisateur

#### Réponses possibles

| Code | Message | Cause |
|------|---------|-------|
| **200** | Texte justifié | Succès |
| **400** | aucun texte fourni | Corps vide ou non fourni |
| **401** | Token manquant ou invalide | Header Authorization absent ou malformé |
| **401** | Token invalide | Token non reconnu en base |
| **402** | Payment Required | Quota quotidien dépassé |

#### Exemple de flux complet

```
1. Utilisateur appelle POST /api/token avec email
   ↓ Retour: { "token": "abc123xyz..." }

2. Utilisateur appelle POST /api/justify avec:
   - Header: Authorization: Bearer abc123xyz...
   - Body: "Mon texte à justifier"
   ↓ Retour: Texte justifié sur 80 caractères

3. La base de données est mise à jour avec:
   - wordCount augmenté
   - Données persistées dans data.json
```

---

## Authentification

### Mécanisme

L'API utilise une authentification **stateless Bearer Token**:

1. **Acquisition du token**: Appelé l'endpoint `/api/token` avec un email
2. **Utilisation du token**: Inclure dans l'en-tête `Authorization: Bearer <token>`
3. **Validation**: Le middleware `authMiddleware` valide le token

### Middleware authMiddleware

```typescript
export function authMiddleware(req: Request, res: Response, next: NextFunction): void
```

**Responsabilités**:
- Extraction du token du header `Authorization`
- Validation de l'existence du token en base de données
- Reset quotidien du compteur de mots si nécessaire
- Injection des données utilisateur dans `req.user`
- Injection du dataStore complet dans `req.dataStore`

**Processus**:

```
Requête entrante
    ↓
Extraction du Bearer Token
    ↓
Vérification format "Bearer <token>"
    ↓
Recherche du token dans data.users
    ↓
Vérification du quota quotidien
    ↓
Reset si nécessaire (date != aujourd'hui)
    ↓
Injection dans req.user et req.dataStore
    ↓
Passage au contrôleur suivant (next)
```

### Erreurs d'authentification

| Condition | Réponse |
|-----------|---------|
| Header `Authorization` absent | 401 - "Token manquant ou invalide" |
| Format ne commence pas par "Bearer " | 401 - "Token manquant ou invalide" |
| Token inexistant en base | 401 - "Token invalide" |

---

## Schémas de données

### User

Structure d'un utilisateur en base de données:

```typescript
{
  email: string,           // Email valide (RFC 5322)
  token: string,           // Token unique généré (32 caractères)
  wordCount: number,       // Nombre de mots traités aujourd'hui (≥0)
  lastResetDate: string    // Date au format YYYY-MM-DD
}
```

**Exemple**:
```json
{
  "email": "john@example.com",
  "token": "a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0",
  "wordCount": 15234,
  "lastResetDate": "2026-01-12"
}
```

### DataStore

Structure complète de la base de données:

```typescript
{
  users: Record<string, User>  // Clé: token, Valeur: User
}
```

**Exemple**:
```json
{
  "users": {
    "a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0": {
      "email": "john@example.com",
      "token": "a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0",
      "wordCount": 15234,
      "lastResetDate": "2026-01-12"
    }
  }
}
```

### Text

Type simple pour le texte:

```typescript
type Text = string  // Minimum 1 caractère
```

### TokenRequest

Payload de la requête `/api/token`:

```typescript
{
  email: string  // Email valide
}
```

---

## Codes de réponse HTTP

### 200 OK

Requête traitée avec succès.

- `POST /api/token`: Retourne `{ "token": "..." }`
- `POST /api/justify`: Retourne le texte justifié

### 400 Bad Request

Données invalides:

- Email invalide pour `/api/token`
- Texte vide pour `/api/justify`

**Exemple**:
```json
{
  "error": "Données invalides",
  "details": { /* Erreurs Zod */ }
}
```

### 401 Unauthorized

Authentification manquante ou invalide:

- Token absent ou manquant
- Token non valide en base de données

**Réponses**:
```
Token manquant ou invalide
Token invalide
```

### 402 Payment Required

Quota quotidien dépassé pour `/api/justify`.

**Réponse**:
```
Payment Required
```

---

## Exemples de requêtes

### Exemple 1: Obtenir un token

```bash
curl -X POST http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Réponse (200)**:
```json
{
  "token": "a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0"
}
```

### Exemple 2: Justifier un texte

```bash
curl -X POST http://localhost:3000/api/justify \
  -H "Authorization: Bearer a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0" \
  -H "Content-Type: text/plain" \
  --data-binary "Ceci est un texte qui sera justifié sur une largeur de 80 caractères par l'API de justification."
```

**Réponse (200)**:
```
Ceci est un texte qui sera justifié sur une largeur de 80 caractères  par
l'API de justification.
```

### Exemple 3: Erreur - Token invalide

```bash
curl -X POST http://localhost:3000/api/justify \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: text/plain" \
  --data-binary "Du texte"
```

**Réponse (401)**:
```
Token invalide
```

### Exemple 4: Erreur - Quota dépassé

```bash
curl -X POST http://localhost:3000/api/justify \
  -H "Authorization: Bearer a7f3c9d2e8b1f6k4l9m2n5p8q1r4s7t0" \
  -H "Content-Type: text/plain" \
  --data-binary "Un très long texte..."
```

**Réponse (402)** (si wordCount + nouveaux_mots > 80000):
```
Payment Required
```

---

## Limites et quotas

### Limite de texte

- **Taille maximale**: 5 MB par requête
- **Raison**: Configuration de `express.text()` pour éviter les surcharges

### Quota de mots

- **Limite quotidienne**: 80 000 mots par utilisateur
- **Reset**: Quotidien à minuit (UTC-0, basé sur `lastResetDate`)
- **Comptage**: Utilise une séparation simple sur les espaces blancs

### Largeur de justification

- **Largeur de ligne**: Exactement 80 caractères
- **Algorithme**: Justification par espaces répartis équitablement

### Paramètres techniques

| Paramètre | Valeur | Configuration |
|-----------|--------|------------------|
| Port serveur | 3000 | `process.env.PORT` ou défaut |
| CORS | Activé | `app.use(cors())` |
| Limite JSON | Non spécifiée | Express par défaut |
| Limite texte brut | 5 MB | `express.text()` |
| Taille token | 32 caractères | `tokenUtils.generateToken()` |

---

## Persistance des données

### Stockage

Les données sont persistées dans un fichier JSON:
- **Chemin**: `backend/src/features/user/data.json`
- **Stratégie**: Sauvegarde synchrone après chaque modification
- **Validation**: Schéma Zod appliqué à chaque lecture/écriture

### Opérations

**Lecture**:
```typescript
public loadData(): DataStore
```
- Charge le fichier JSON
- Valide avec le schéma Zod
- Retourne une structure DataStore valide

**Écriture**:
```typescript
public saveData(data: DataStore): void
```
- Valide les données avec le schéma Zod
- Écrit dans le fichier JSON avec indentation (2 espaces)
- Gestion des erreurs avec logs

---

## Déploiement et configuration

### Variables d'environnement

```bash
PORT=3000                # Port d'écoute (défaut: 3000)
```

### Commande de démarrage

```bash
npm start                # Lance le serveur
npm run dev              # Mode développement avec hot reload
npm test                 # Lance les tests
```

### Vérification de santé

```bash
curl http://localhost:3000/api/token -X POST
```

---

## Support et maintenance

### Logs et débogage

Le serveur loggue:
- Erreurs de chargement/sauvegarde de données
- Démarrage du serveur avec le port utilisé

### Fichiers importants

- [TextController](../src/features/text/textController.ts) - Logique de justification
- [TokenController](../src/features/token/tokenController.ts) - Génération de tokens
- [Auth Middleware](../src/middlewares/token.ts) - Authentification
- [UserRepository](../src/features/user/userRepository.ts) - Persistance

---
