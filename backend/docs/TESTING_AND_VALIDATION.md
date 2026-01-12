# Justify API - Guide de test et validation

## Table des matières

1. [Scénarios de test](#scénarios-de-test)
2. [Cas de test complets](#cas-de-test-complets)
3. [Validations de sécurité](#validations-de-sécurité)
4. [Checklist de déploiement](#checklist-de-déploiement)

---

## Scénarios de test

### Niveau 1: Tests unitaires basiques

#### Test 1.1 - Tokenization valide
```
Description: Générer un token avec un email valide
Endpoint: POST /api/token
Input: { "email": "test@example.com" }
Expected: { "token": "..." } (status 200)
Validations:
  - Token est une chaîne
  - Token a exactement 32 caractères
  - Token est alphanumériques
  - Email stocké correctement
```

#### Test 1.2 - Réutilisation de token
```
Description: Retourner le même token pour le même email
Endpoint: POST /api/token
Steps:
  1. POST /api/token { "email": "test@example.com" }
     → Response: { "token": "abc123..." }
  2. POST /api/token { "email": "test@example.com" }
     → Response: { "token": "abc123..." } (SAME)
```

### Niveau 2: Tests d'authentification

#### Test 2.1 - Authentification valide
```
Description: Accéder à /justify avec token valide
Setup:
  1. Créer token: POST /api/token { "email": "test@example.com" }
     → token = "abc123..."
Endpoint: POST /api/justify
Headers: Authorization: Bearer abc123...
Body: "Hello world"
Expected: status 200, texte justifié
```

#### Test 2.2 - Token manquant
```
Description: Rejeter sans header Authorization
Endpoint: POST /api/justify
Headers: (aucun Authorization)
Body: "Hello world"
Expected: status 401, "Token manquant ou invalide"
```

#### Test 2.3 - Token invalide
```
Description: Rejeter token non reconnu
Endpoint: POST /api/justify
Headers: Authorization: Bearer invalid_token_123456
Body: "Hello world"
Expected: status 401, "Token invalide"
```

### Niveau 3: Tests métier

#### Test 3.1 - Justification simple
```
Description: Justifier un texte court
Setup: Token obtenu
Endpoint: POST /api/justify
Body: "Hello world from API"
Expected: 
  - Status 200
  - Contenu texte justifié
  - Largeur max 80 caractères
  - Espaces répartis équitablement
```

#### Test 3.2 - Justification longue
```
Description: Justifier un texte de plusieurs lignes
Setup: Token obtenu
Endpoint: POST /api/justify
Body: [texte de 2-3 paragraphes]
Expected:
  - Status 200
  - Chaque ligne max 80 caractères
  - Toutes les lignes justifiées sauf dernière
  - Espaces internes répartis
```

#### Test 3.3 - Comptage des mots
```
Description: Vérifier le comptage des mots
Setup: Token obtenu
Endpoint: POST /api/justify
Body: "Un deux trois quatre cinq" (5 mots)
Validation:
  - user.wordCount augmente de 5
  - Limite vérifiée correctement
```

#### Test 3.4 - Quota dépassé
```
Description: Rejeter requête qui dépasse le quota
Setup: 
  1. Créer token pour "test@example.com"
  2. Modifier data.json: wordCount = 79995
  3. Appeler /justify avec texte de 10 mots
Expected: status 402, "Payment Required"
```

---

## Cas de test complets

### Suite de test cURL

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
EMAIL="testuser@example.com"

echo "=== Test 1: Création de token ==="
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/token" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "Response: $TOKEN_RESPONSE"
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

echo -e "\n=== Test 2: Justifier un texte ==="
TEXT="Ceci est un texte qui sera justifié sur une largeur de 80 caractères par l'API."
JUSTIFIED=$(curl -s -X POST "$API_URL/justify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary "$TEXT")

echo "Justified:"
echo "$JUSTIFIED"
echo ""

echo "=== Test 3: Quota après justification ==="
# Relancer token request pour voir wordCount
curl -s -X POST "$API_URL/token" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}" | jq .

echo -e "\n=== Test 4: Token invalide ==="
curl -s -X POST "$API_URL/justify" \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: text/plain" \
  --data-binary "Test" -w "Status: %{http_code}\n"

echo -e "\n=== Test 5: Texte vide ==="
curl -s -X POST "$API_URL/justify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary "" -w "Status: %{http_code}\n"
```

### Suite de test Postman

**Environnement**:
```json
{
  "variables": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:3000/api",
      "type": "string"
    },
    {
      "key": "TOKEN",
      "value": "",
      "type": "string"
    },
    {
      "key": "EMAIL",
      "value": "postman@test.com",
      "type": "string"
    }
  ]
}
```

**Collection**:

1. **POST - Get Token**
   ```
   URL: {{BASE_URL}}/token
   Method: POST
   Headers: Content-Type: application/json
   Body: { "email": "{{EMAIL}}" }
   Tests:
     pm.test("Status 200", () => {
       pm.response.to.have.status(200);
     });
     pm.test("Has token", () => {
       pm.expect(pm.response.json()).to.have.property('token');
     });
     pm.collectionVariables.set("TOKEN", pm.response.json().token);
   ```

2. **POST - Justify Text**
   ```
   URL: {{BASE_URL}}/justify
   Method: POST
   Headers: 
     Authorization: Bearer {{TOKEN}}
     Content-Type: text/plain
   Body: "Un texte à justifier sur 80 caractères."
   Tests:
     pm.test("Status 200", () => {
       pm.response.to.have.status(200);
     });
     pm.test("Is plain text", () => {
       pm.expect(pm.response.headers.get('Content-Type')).to.include('text/plain');
     });
   ```

3. **POST - Invalid Token**
   ```
   URL: {{BASE_URL}}/justify
   Method: POST
   Headers:
     Authorization: Bearer invalid
     Content-Type: text/plain
   Body: "Test"
   Tests:
     pm.test("Status 401", () => {
       pm.response.to.have.status(401);
     });
   ```

---

## Validations de sécurité

### Test de validation des inputs

| Cas | Input | Expected | Status |
|-----|-------|----------|--------|
| Email valide | test@example.com | Accepté | ✅ |
| Email sans @ | testemail | Rejeté | ❌ |
| Email sans domaine | test@ | Rejeté | ❌ |
| Email long valide | very.long.email+tag@sub.example.com | Accepté | ✅ |
| Texte normal | "Hello world" | Accepté | ✅ |
| Texte vide | "" | Rejeté | ❌ |
| Texte 1 caractère | "A" | Accepté | ✅ |
| Texte avec spéciaux | "Texte!@#$%^&*()" | Accepté | ✅ |
| Unicode | "Héllo wørld" | Accepté | ✅ |

