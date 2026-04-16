# Système de Mise à Jour (Mboa Drive)

Mboa Drive inclut un système de mise à jour automatique complet pour les versions Desktop.

## Architecture du Système

### 1. Backend (API)
- **Endpoint** : `GET /api/versions/latest?platform=desktop`
- **Table** : `AppVersion` dans Supabase
- **Champs** : version_name, version_code, platform, download_url, notes, is_valid

### 2. Interface Admin Web
Accessible uniquement aux administrateurs via `/admin` :
- **Comptes admin** : determines en base via `User.is_admin = true`
- **Fonctionnalités** : CRUD complet sur les versions
- **Validation** : Seule la dernière version marquée `is_valid=true` est proposée aux clients

### 3. Application Desktop (Electron)

#### Détection
- Vérification au démarrage de l'application
- Vérification périodique toutes les 30 minutes
- Comparaison du `version_code` local avec celui du serveur

#### Téléchargement
- **Méthode native** : Via `electron-updater` (intégré à Electron)
- **Méthode fallback** : Lien direct vers l'URL de téléchargement
- Téléchargement en arrière-plan sans interruption

#### Installation
- Notification lorsque la mise à jour est prête
- Installation en un clic avec redémarrage automatique
- Application de la mise à jour à la fermeture si l'utilisateur refuse immédiatement

## Flux de Mise à Jour

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Web     │────▶│   API Backend    │────▶│ Desktop Client  │
│  (Publie v2.0)  │     │ (Stocke version) │     │ (Vérifie API)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                           ┌─────────────────────────────────┘
                           ▼
                    ┌─────────────────┐
                    │  Notification   │
                    │"Mise à jour    │
                    │ disponible"    │
                    └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │  Téléchargement │
                    │   (silent)      │
                    └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │  Installation   │
                    │ (redémarrage)   │
                    └─────────────────┘
```

## Configuration Technique

### Backend
Les routes de gestion des versions (protégées par `adminMiddleware`) :
```javascript
// routes/version.routes.js
router.get('/latest', getLatestVersion);           // Public
router.get('/', authMiddleware, adminMiddleware, listVersions);
router.post('/', authMiddleware, adminMiddleware, createVersion);
router.put('/:id', authMiddleware, adminMiddleware, updateVersion);
```

### Desktop
Configuration dans `electron/main.cjs` :
```javascript
autoUpdater.autoDownload = false;  // Téléchargement manuel
autoUpdater.autoInstallOnAppQuit = true;  // Installation auto à la fermeture

// Vérification périodique
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 30 * 60 * 1000);
```

### Constantes de Version
Dans `frontend/desktop/src/components/Common/UpdateChecker.tsx` :
```typescript
const CURRENT_VERSION_CODE = 101; // 1.0.1
```

## Scopes Google OAuth (Non Restreints)

Pour éviter le processus d'audit complexe de Google, l'application utilise uniquement des scopes **non restreints** :
- `drive.file` : Accès uniquement aux fichiers créés par l'application
- `drive.metadata.readonly` : Lecture des métadonnées
- `gmail.compose` : Création de brouillons (non envoi automatique)
- `documents.readonly` : Lecture des documents
- `spreadsheets.readonly` : Lecture des feuilles de calcul

## Commandes Utiles (supabase.sh)

```bash
# Mettre à jour les versions applicatives
./supabase.sh update-versions

# Voir les versions actuelles
./supabase.sh query "SELECT * FROM AppVersion ORDER BY version_code DESC"

# Marquer une version comme valide
./supabase.sh query "UPDATE AppVersion SET is_valid=true WHERE id='xxx'"
```

## Rôles Administrateurs
Seuls les emails suivants peuvent gérer les versions :
- comptes presents dans la table `User` avec `is_admin = true`

La connexion à l'interface admin utilise le même système d'authentification JWT que l'application principale.
