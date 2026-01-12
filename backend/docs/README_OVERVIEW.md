# Justify API - Vue d'ensemble rapide

## TL;DR

**Justify** est une micro-API REST simple qui fournit:
- ✅ Génération/récupération de tokens d'authentification
- ✅ Justification de texte sur 80 caractères
- ✅ Gestion de quotas quotidiens (80 000 mots/jour)

**Stack**: Node js + Express.js + TypeScript + Zod + JSON file storage

**Deux endpoints principaux**:
1. `POST /api/token` - Obtenir un token (pas d'auth requise)
2. `POST /api/justify` - Justifier du texte (Bearer Token requis)

---

## Démarrage rapide

### Installation

```bash
cd backend
npm install
npm run build  # ou npm run dev pour mode développement
```

### Premier appel

```bash
# 1. Obtenir un token
curl -X POST http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Response: { "token": "abc123..." }

# 2. Justifier du texte
curl -X POST http://localhost:3000/api/justify \
  -H "Authorization: Bearer abc123..." \
  -H "Content-Type: text/plain" \
  --data-binary "Votre texte ici"
# Response: Texte justifié sur 80 caractères
```

---

## Points architecturaux clés

### Flux d'une requête

```
Request → Express Middleware (JSON/Text Parser)
       → Router (registerRoutes)
       → Feature Routes (TextRoutes / TokenRoutes)
       → Middleware optionnel (authMiddleware)
       → Controllers (logique métier)
       → Utils (justification, tokens, etc.)
       → Repository (persistence)
       → Response
```

### Design patterns utilisés

| Pattern | Usage | Location |
|---------|-------|----------|
| **Repository** | Abstraction de la persistance | `UserRepository` |
| **Utility** | Logique métier générique | `TextUtils`, `TokenUtils` |
| **Controller** | Orchestration requête/réponse | `TextController`, `TokenController` |
| **Middleware** | Authentification/validation | `authMiddleware` |
| **Singleton** | Instances uniques | `textController`, `tokenController`, etc. |

### Sérialisation et validation

- **Zod** pour validation stricte de tous les inputs
- **TypeScript** pour type-safety au compile-time
- **Schémas centralisés** dans chaque dossier feature

---

## ✅ Points positifs

- ✅ Code bien structuré par features
- ✅ Validation stricte avec Zod
- ✅ Authentification simple mais efficace
- ✅ Séparation claire des responsabilités
- ✅ Type-safe (TypeScript)
- ✅ Pas de dépendances externes inutiles

---

## Documentation disponible

### 📄 Fichiers de documentation

| Fichier | Audience | Détail |
|---------|----------|--------|
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Tous | Spec complète des endpoints |
| [ARCHITECTURE_AND_INTEGRATION.md](ARCHITECTURE_AND_INTEGRATION.md) | Tech | Diagrammes, flux, intégration |
| [TESTING_AND_VALIDATION.md](TESTING_AND_VALIDATION.md) | QA/Test | Cas de test, checklist |
| [README_OVERVIEW.md](README_OVERVIEW.md) | DevOps/Ops | Déploiement, ops |

### 📚 Lire dans cet ordre

1. **Ce fichier** - Vue d'ensemble rapide
2. **API_DOCUMENTATION.md** - Spécification technique
3. **ARCHITECTURE_AND_INTEGRATION.md** - Pour comprendre le code
4. **TESTING_AND_VALIDATION.md** - Avant production

---

## Structure du code

```
backend/
├── src/
│   ├── features/
│   │   ├── text/               # Justification
│   │   │   ├── index.ts
│   │   │   ├── textController.ts
│   │   │   ├── textRoutes.ts
│   │   │   ├── textTypes.ts
│   │   │   └── textUtils.ts
│   │   ├── token/              # Authentification
│   │   │   ├── index.ts
│   │   │   ├── tokenController.ts
│   │   │   ├── tokenRoutes.ts
│   │   │   ├── tokenTypes.ts
│   │   │   └── tokenUtils.ts
│   │   └── user/               # Persistence
│   │       ├── index.ts
│   │       ├── data.json       # ⚠️ Fichier données
│   │       ├── userRepository.ts
│   │       └── userTypes.ts
│   ├── middlewares/
│   │   └── token.ts            # Authentification middleware
│   └── routes/
│       └── registerRoutes.ts    # Enregistrement routes
├── test/
│   └── api.test.ts             # Tests
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE_AND_INTEGRATION.md
│   ├── TESTING_AND_VALIDATION.md
│   └── README_OVERVIEW.md      # Ce fichier
├── index.ts                     # Point d'entrée
├── package.json
├── tsconfig.json
└── jest.config.js
```

**Règles d'organisation**:
- Chaque feature = dossier dédié
- Tous les fichiers d'une feature au même niveau
- Types et utilitaires dans le dossier feature
- Pas de imports croisés entre features
- Repository pour persistence centralisée

---

## Scripts disponibles

```bash
npm start              # Lancer le serveur
npm run dev            # Mode développement avec nodemon
npm run build          # Compiler TypeScript
npm test               # Lancer les tests Jest
npm run test:coverage       # Rapport de couverture
```

---