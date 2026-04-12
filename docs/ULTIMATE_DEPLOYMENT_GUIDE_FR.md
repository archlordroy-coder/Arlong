# 🛠️ Guide Ultime : De la Configuration Google Cloud au Déploiement Final

Ce guide exhaustif détaille chaque étape pour configurer, sécuriser et déployer l'écosystème **Mboa Drive**. Il est destiné aux administrateurs et développeurs seniors.

---

## 1. Configuration Google Cloud Platform (GCP)
Mboa Drive utilise Google Drive comme moteur de stockage miroir. La configuration OAuth est cruciale.

### 1.1 Création et API
1. Connectez-vous à la [Console Google Cloud](https://console.cloud.google.com/).
2. Activez l'API **Google Drive**.

### 1.2 Écran de Consentement OAuth (Branding)
Google vérifie manuellement le branding pour éviter les alertes de sécurité "Application non vérifiée".
- **Domaine autorisé** : `arlong-gamma.vercel.app`
- **Application Home Page** : `https://arlong-gamma.vercel.app`
- **Politique de confidentialité** : `/privacy`
- **Logo** : Utilisez le logo officiel `logo.png`.
- **Scopes requis** : `.../auth/drive.file` (Permet à l'app de lire/écrire uniquement les fichiers qu'elle a créés).

### 1.3 Identifiants OAuth 2.0
Créez un **ID client OAuth** (Type : Web Application).
- **Origines JavaScript autorisées** :
  - `http://localhost:5173` (Développement)
  - `https://arlong-gamma.vercel.app` (Production)
- **URIs de redirection autorisés** :
  - `http://localhost:5000/api/auth/google/callback`
  - `https://mboadrive-backend-production.up.railway.app/api/auth/google/callback`

---

## 2. Infrastructure de Données (Supabase)
Mboa Drive utilise **Supabase** pour la base de données PostgreSQL et la gestion des utilisateurs (Auth).

1. Créez un projet sur Supabase.
2. Exécutez le schéma SQL (souvent fourni dans `backend/prisma/schema.prisma` ou via les migrations).
3. Récupérez votre **SUPABASE_URL** et **SUPABASE_ANON_KEY**.
4. Configurez les **Redirect URLs** dans Supabase Auth : `mboadrive://app/login-success` pour le mobile.

---

## 3. Configuration du Backend (Node.js)
Le backend sert de passerelle entre le frontend, Supabase et Google.

### Fichier `.env` (Indispensable)
```env
PORT=5000
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://votre-backend.com/api/auth/google/callback
FRONTEND_URL=https://arlong-gamma.vercel.app
```

---

## 4. Déploiement du Frontend Web
Le frontend web est optimisé pour **Vercel**.

1. Connectez votre dépôt GitHub à Vercel.
2. Définissez les variables d'environnement dans l'interface Vercel (`VITE_API_URL`).
3. Le déploiement est automatique à chaque push sur `main`.

---

## 5. Déploiement Mobile (Android)
Mboa Drive utilise **Capacitor** pour transformer le code React en application native.

### 5.1 Préparation
```bash
cd frontend/mobile
npm run build
npx cap sync android
```

### 5.2 Deep Linking (Configuration Native)
Pour que la redirection Google Drive fonctionne, le fichier `AndroidManifest.xml` doit contenir l'intent-filter pour `mboadrive://` :
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="mboadrive" android:host="app" />
</intent-filter>
```

### 5.3 Compilation APK
Utilisez le script racine : `./build-apk.sh`. 
Cela automatise le build Vite, la synchronisation Capacitor et la génération de l'APK via Gradle.

---

## 6. Déploiement Desktop (Electron)
Pour générer les installateurs Windows et Linux :

1. Allez dans `frontend/desktop`.
2. Installez les dépendances : `npm install`.
3. Lancez le build : `npm run build:exe` (Windows) ou `npm run build:linux` (Linux).
4. Les fichiers de sortie se trouvent dans le dossier `dist/`.

---

## 7. Pipeline CI/CD (GitHub Actions)
Le fichier `.github/workflows/` contient l'intelligence de déploiement.
- **Node 24** est forcé pour garantir la compatibilité des scripts.
- Les secrets GitHub (`SUPABASE_URL`, etc.) doivent être configurés dans les paramètres du dépôt pour que les builds réussissent.

---
**Note de sécurité** : Ne commitez jamais vos fichiers `.env` réels. Utilisez des secrets d'environnement.
