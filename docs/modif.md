# Modifications et Corrections - Projet Arlong

## 🔴 Problèmes Identifiés et Solutions

### 1. Erreur 500 sur `/api/historique`

**Problème** : Requête Supabase trop complexe avec jointures imbriquées
**Fichier** : `backend/src/controllers/historique.controller.js`

**Solution** :
```javascript
// AVANT (trop complexe)
let query = supabase
  .from('Historique')
  .select(`
    *,
    user:User(id, name, email, avatar),
    document:Document(id, name, type, isDeleted, dossier:Dossier(id, name, createdById, isPublic, espace:Espace(id, name)))
  `, { count: 'exact' });

// APRÈS (simplifié)
let query = supabase
  .from('Historique')
  .select('*', { count: 'exact' });
query = query.eq('userId', req.user.id);
```

---

### 2. Erreur 404 sur `/api/auth/profile`

**Problème** : Endpoint manquant, le frontend appelle `/api/auth/profile`
**Fichier** : `backend/src/routes/auth.routes.js`

**Solution** :
```javascript
// Ajouter après les routes /me
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
```

---

### 3. Erreur 401 sur login/register

**Problème** : JWT envoyé sur endpoints publics
**Fichier** : `frontend/web/src/api/client.ts`

**Solution** :
```typescript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mboadrive_token');
    const isPublicEndpoint = config.url?.includes('/auth/login') || 
                             config.url?.includes('/auth/register') ||
                             config.url?.includes('/auth/google');
    
    if (token && config.headers && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

---

### 4. Erreur JWT "expiresIn"

**Problème** : `process.env.JWT_EXPIRES_IN` invalide
**Fichier** : `backend/src/controllers/auth.controller.js`

**Solution** :
```javascript
// Remplacer process.env.JWT_EXPIRES_IN par une valeur hardcodée
const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
  expiresIn: '7d',  // Au lieu de process.env.JWT_EXPIRES_IN
});
```

---

## 📋 Liste Complète des Modifications

### Backend

| Fichier | Ligne | Action | Description |
|---------|-------|--------|-------------|
| `historique.controller.js` | 28-54 | Remplacer | Simplifier la requête Supabase |
| `historique.controller.js` | 66-73 | Ajouter | Meilleure gestion des erreurs |
| `auth.routes.js` | 22-23 | Ajouter | Routes `/profile` GET et PUT |
| `auth.controller.js` | 81-83, 149-151, 402-406 | Modifier | Hardcoder `expiresIn: '7d'` |
| `auth.controller.js` | 56, 76, 100, 120 | Ajouter | Logs de débogage |

### Frontend

| Fichier | Ligne | Action | Description |
|---------|-------|--------|-------------|
| `api/client.ts` | 11-20 | Modifier | Condition pour ne pas envoyer JWT sur auth public |

---

## 🧪 Commandes de Test

```bash
# Test inscription
curl -X POST https://arlong-gamma.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST https://arlong-gamma.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test historique (avec token)
curl -X GET "https://arlong-gamma.vercel.app/api/historique?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test profile
curl -X GET https://arlong-gamma.vercel.app/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Déploiement

```bash
# Commit et push
git add -A
git commit -m "fix: historique query, auth/profile route, JWT on public endpoints"
git push origin main

# Déployer sur Vercel
npx vercel --prod
```

---

## ✅ Vérification Post-Déploiement

| Endpoint | Méthode | Statut Attendu |
|----------|---------|----------------|
| `/api/auth/register` | POST | 201 Created |
| `/api/auth/login` | POST | 200 OK |
| `/api/auth/profile` | GET | 200 OK |
| `/api/historique` | GET | 200 OK |
| `/api/espaces` | GET | 200 OK |

---

## 🔧 Intégrations Manquantes à Vérifier

### Google Drive
- **Statut** : Bouton existe mais nécessite configuration OAuth
- **Action** : Vérifier `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sur Vercel

### Supabase Storage
- **Statut** : Configuré mais vérifier les buckets
- **Action** : Créer bucket `documents` si inexistant

### Tables à Vérifier
- `User` - ✅ Existe
- `Espace` - ✅ Existe
- `EspaceUser` - ✅ Existe
- `Dossier` - ✅ Existe
- `Document` - ✅ Existe
- `Historique` - ✅ Existe

---

## 📅 Date de Création
16 Avril 2026

## 📝 Notes
- Les modifications sont en local, pas encore pushées
- Tester chaque endpoint après déploiement
- Surveiller les logs Vercel pour erreurs
