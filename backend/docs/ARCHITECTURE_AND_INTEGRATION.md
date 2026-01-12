# Justify API - Guide d'intégration et architecture

## Table des matières

1. [Diagrammes](#diagrammes)
2. [Flux d'exécution](#flux-dexécution)
3. [Architecture détaillée](#architecture-détaillée)
4. [Guide d'intégration](#guide-dintégration)
5. [Gestion des erreurs](#gestion-des-erreurs)
6. [Performance et optimisations](#performance-et-optimisations)

---

## Diagrammes

### Flux d'authentification et justification

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT APPLICATION                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [Étape 1]               [Étape 2]
   POST /token             POST /justify
   {email}          (avec Bearer Token)
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXPRESS SERVER (index.ts)                                       │
│ ├─ CORS middleware                                              │
│ ├─ JSON/Text parser middleware                                  │
│ └─ Router (registerRoutes)                                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   TokenRoutes          TextRoutes
   POST /token          POST /justify
        │                     │
        │                     ├─► authMiddleware
        │                     │   ├─ Validation Bearer Token
        │                     │   ├─ Lookup user in data
        │                     │   ├─ Check quota reset
        │                     │   └─ Inject req.user & req.dataStore
        │                     │
        ▼                     ▼
   TokenController    TextController
   generateToken()    justify()
        │                     │
        ├─ Parse email        ├─ Validate text
        ├─ Load user data     ├─ Check word count limit
        ├─ Check existing     ├─ Count words
        ├─ Generate token     ├─ Apply justification algo
        ├─ Save user          ├─ Update user quota
        └─ Return token       └─ Save to persistent storage
                              └─ Return justified text
```

### Architecture en couches

```
┌────────────────────────────────────────────────┐
│ PRÉSENTATION (Controllers)                     │
│ ├─ TextController                              │
│ └─ TokenController                             │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│ LOGIQUE MÉTIER (Utils)                         │
│ ├─ TextUtils (justifyText, countWords)         │
│ └─ TokenUtils (generateToken, getTodayDate)    │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│ ACCÈS AUX DONNÉES (Repository)                 │
│ └─ UserRepository (loadData, saveData)         │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│ PERSISTANCE (Fichier JSON)                     │
│ └─ data.json                                   │
└────────────────────────────────────────────────┘
```

### Gestion du cycle de vie d'une requête

```
REQUEST IN
    │
    ▼
┌──────────────────────────────────────────┐
│ express.json() / express.text()          │ ← Parsing du body
│ Limit: 5MB for text/plain                │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ CORS Middleware                          │ ← Vérification CORS
│ Allow all origins                        │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Router (registerRoutes)                  │ ← Matching de route
│ /api/token → TokenRoutes                 │
│ /api/justify → TextRoutes + authMW       │
└────────────┬─────────────────────────────┘
             │
             ├─ POST /api/token
             │  └─ TokenController.generateToken()
             │
             └─ POST /api/justify
                ├─ authMiddleware (validation)
                └─ TextController.justify()
                   │
                   ▼
                ┌────────────────────┐
                │ Persistance        │
                │ Save to data.json  │
                └────────────────────┘
    │
    ▼
RESPONSE OUT
```

---

## Flux d'exécution

### POST /api/token - Flux détaillé

```
1. CLIENT REQUEST
   ├─ Method: POST
   ├─ URL: /api/token
   ├─ Header: Content-Type: application/json
   └─ Body: { "email": "user@example.com" }

2. SERVER PARSING
   ├─ express.json() parse le body
   ├─ Route matching → TokenController.generateToken()

3. VALIDATION
   ├─ TokenRequestSchema.parse(req.body)
   ├─ Si INVALID → 400 Bad Request
   └─ Si VALID → continue

4. BUSINESS LOGIC
   ├─ userRepository.loadData() [read data.json]
   ├─ Boucle sur les utilisateurs existants
   │  ├─ SI email trouvé → existingToken = token
   │  └─ SINON → continue
   │
   ├─ SI existingToken existe
   │  └─ Retourner { token: existingToken }
   │
   └─ SI nouvel utilisateur
      ├─ Générer token unique (32 chars)
      ├─ Créer objet userData:
      │  ├─ email: string
      │  ├─ token: string
      │  ├─ wordCount: 0
      │  └─ lastResetDate: "YYYY-MM-DD"
      ├─ data.users[token] = userData
      ├─ userRepository.saveData(data) [write to data.json]
      └─ Retourner { token: token }

5. RESPONSE
   └─ Status 200 + JSON { "token": "..." }
```

### POST /api/justify - Flux détaillé

```
1. CLIENT REQUEST
   ├─ Method: POST
   ├─ URL: /api/justify
   ├─ Header: Authorization: Bearer <token>
   ├─ Header: Content-Type: text/plain
   └─ Body: [texte brut]

2. MIDDLEWARE: authMiddleware
   ├─ Extrait le header Authorization
   ├─ Vérification format "Bearer "
   │  └─ SI INVALID → 401 "Token manquant ou invalide"
   │
   ├─ Extrait le token (substring from position 7)
   ├─ userRepository.loadData() [read data.json]
   ├─ userData = data.users[token]
   │  └─ SI UNDEFINED → 401 "Token invalide"
   │
   ├─ today = tokenUtils.getTodayDate() [format YYYY-MM-DD]
   ├─ SI userData.lastResetDate ≠ today
   │  ├─ userData.wordCount = 0
   │  ├─ userData.lastResetDate = today
   │  └─ userRepository.saveData(data) [reset quotidien]
   │
   ├─ Injection dans req
   │  ├─ (req as any).user = userData
   │  └─ (req as any).dataStore = data
   │
   └─ next() → Continue vers TextController

3. PARSING & VALIDATION
   ├─ textData = req.body (texte brut)
   ├─ TextSchema.parse(textData)
   │  └─ SI empty → 400 "aucun texte fourni"

4. BUSINESS LOGIC: justification
   ├─ Récupérer userData et dataStore depuis req
   ├─ textUtils.countWords(textData)
   │  ├─ Split on /\s+/
   │  └─ Retourner nombre de mots
   │
   ├─ Vérifier quota
   │  ├─ DAILY_LIMIT = 80000
   │  ├─ SI userData.wordCount + wordCount > DAILY_LIMIT
   │  │  └─ 402 "Payment Required"
   │  │
   │  └─ SINON → continue
   │
   ├─ Mettre à jour quota
   │  ├─ userData.wordCount += wordCount
   │  └─ dataStore.users[userData.token] = userData
   │
   ├─ textUtils.justifyText(textData)
   │  ├─ Split texte en mots
   │  ├─ Construire lignes de max 80 caractères
   │  ├─ Justifier chaque ligne
   │  │  ├─ Si 1 mot → ajouter espaces à droite
   │  │  └─ Si n mots → répartir espaces entre les gaps
   │  └─ Retourner texte justifié avec \n
   │
   ├─ userRepository.saveData(dataStore) [persist change]

5. RESPONSE
   ├─ Status 200
   ├─ Header Content-Type: text/plain
   └─ Body: [texte justifié]
```

---

## Architecture détaillée

### Composants principaux

#### 1. TextController

```typescript
class TextController {
  justify(req: Request, res: Response): void
}
```

**Responsabilités**:
- Extraire les données de requête (`req.body`, `req.user`, `req.dataStore`)
- Valider que le texte n'est pas vide
- Compter les mots du texte
- Vérifier le quota quotidien
- Appeler l'algorithme de justification
- Mettre à jour et persister les données utilisateur
- Retourner le texte justifié

**Points clés**:
- Utilise `textUtils` pour les opérations métier
- Utilise `userRepository` pour la persistance
- Injecte directement dans `req` (typage faible avec `as any`)

#### 2. TokenController

```typescript
class TokenController {
  generateToken(req: Request, res: Response): void
}
```

**Responsabilités**:
- Parser et valider l'email avec Zod
- Charger les données existantes
- Rechercher un utilisateur avec cet email
- Générer un nouveau token ou retourner l'existant
- Persister les nouvelles données

**Points clés**:
- Gestion d'erreur Zod spécifique
- Recherche linéaire sur les utilisateurs (O(n))
- Génération de token via `tokenUtils`

#### 3. TextUtils

```typescript
class TextUtils {
  justifyText(text: Text): Text
  countWords(text: Text): number
}
```

**Algorithme de justification**:

1. Séparer le texte en mots (regex `/\s+/`)
2. Construire des lignes de max 80 caractères
3. Pour chaque ligne (sauf la dernière):
   - Calculer les espaces manquants
   - Si 1 mot: remplir avec des espaces à droite
   - Si n mots: répartir les espaces sur les gaps
4. Joindre les lignes avec `\n`

**Exemple**:
```
Entrée: "Hello world from API"
Mots: ["Hello", "world", "from", "API"]
Ligne 1: "Hello world from API" (20 chars)
Sortie justifiée: "Hello     world     from API" (80 chars)
```

#### 4. TokenUtils

```typescript
class TokenUtils {
  generateToken(): string
  getTodayDate(): string
}
```

**Détails**:
- `generateToken()`: Génère 32 caractères alphanumériques aléatoires
- `getTodayDate()`: Retourne la date au format `YYYY-MM-DD` (UTC-0)

#### 5. UserRepository

```typescript
class UserRepository {
  loadData(): DataStore
  saveData(data: DataStore): void
}
```

**Opérations**:
- **loadData()**: 
  - Lit `data.json`
  - Valide avec Zod
  - Retourne structure valide ou `{ users: {} }`
  
- **saveData()**:
  - Valide les données avec Zod
  - Écrit dans `data.json` avec indentation
  - Gère les erreurs de fichier

#### 6. Auth Middleware

```typescript
function authMiddleware(req: Request, res: Response, next: NextFunction): void
```

**Pipeline**:
1. Valider format du Bearer Token
2. Extraire le token
3. Chercher l'utilisateur
4. Vérifier et reset quotidien si nécessaire
5. Injecter dans `req.user` et `req.dataStore`
6. Appeler `next()`

### Modèles de données

#### Schémas Zod

**UserSchema**:
```typescript
z.object({
  email: z.email(),
  token: z.string(),
  wordCount: z.number().int().min(0),
  lastResetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})
```

**DataStoreSchema**:
```typescript
z.object({
  users: z.record(z.string(), UserSchema)
})
```

**TokenRequestSchema**:
```typescript
z.object({
  email: z.email()
})
```

**TextSchema**:
```typescript
z.string().min(1, "Content cannot be empty")
```

---

## Guide d'intégration

### Exemple d'intégration cliente (TypeScript)

```typescript
class JustifyAPIClient {
  private baseURL = "http://localhost:3000/api";
  private token: string | null = null;

  // Étape 1: Authentification
  async authenticate(email: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    const data = await response.json();
    this.token = data.token;
    return data.token;
  }

  // Étape 2: Justifier un texte
  async justifyText(text: string): Promise<string> {
    if (!this.token) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    const response = await fetch(`${this.baseURL}/justify`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "text/plain"
      },
      body: text
    });

    if (response.status === 402) {
      throw new Error("Daily quota exceeded");
    }

    if (response.status === 401) {
      throw new Error("Invalid or expired token");
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.text();
  }
}

// Usage
const client = new JustifyAPIClient();
await client.authenticate("user@example.com");
const justified = await client.justifyText("Un long texte à justifier...");
console.log(justified);
```

### Configuration requête HTTP

```typescript
// POST /api/token
{
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    email: "user@example.com"
  })
}

// POST /api/justify
{
  method: "POST",
  headers: {
    "Authorization": "Bearer <token>",
    "Content-Type": "text/plain"
  },
  body: "Texte brut..."
}
```

### Gestion des erreurs côté client

```typescript
async function justifyWithErrorHandling(text: string, token: string) {
  try {
    const response = await fetch("http://localhost:3000/api/justify", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain"
      },
      body: text
    });

    switch (response.status) {
      case 200:
        return await response.text();
      
      case 400:
        console.error("Texte invalide (vide?)");
        break;
      
      case 401:
        console.error("Token invalide ou expiré");
        break;
      
      case 402:
        console.error("Quota quotidien dépassé (80000 mots max)");
        break;
      
      default:
        console.error(`Erreur serveur: ${response.status}`);
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
  }
}
```

---

## Gestion des erreurs

### Hiérarchie des erreurs

```
Erreur
├─ Erreur de validateur (Zod)
│  └─ Email invalide
│  └─ Texte vide
│  └─ Structure invalide
│
├─ Erreur d'authentification
│  ├─ Token manquant
│  ├─ Token invalide
│  └─ Token expiré (quota reset)
│
├─ Erreur métier
│  ├─ Quota dépassé (402)
│  └─ Contenu invalide (400)
│
└─ Erreur système
   ├─ Erreur fichier (loadData/saveData)
   └─ Erreur réseau (CORS, timeout)
```

### Stratégie de gestion

**TextController**:
```typescript
if (!textData || textData.length === 0) {
  res.status(400).send("aucun texte fourni");
  return;
}

if (UserData.wordCount + wordCount > DAILY_LIMIT) {
  res.status(402).send("Payment Required");
  return;
}
```

**TokenController**:
```typescript
try {
  const { email } = TokenRequestSchema.parse(req.body);
  // ... logique
} catch (error) {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Données invalides',
      details: error
    });
    return;
  }
}
```

**authMiddleware**:
```typescript
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  res.status(401).send('Token manquant ou invalide');
  return;
}

const userData = data.users[token];
if (!userData) {
  res.status(401).send('Token invalide');
  return;
}
```

### Logging et monitoring

Actuellement limité à:
```typescript
console.error('Erreur lors du chargement des données:', error);
console.error('Erreur lors de la sauvegarde des données:', error);
console.log(`Server running on http://localhost:${PORT}`);
```
---

