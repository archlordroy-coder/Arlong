# 🌍 Guide Complet : Configuration Google OAuth2 & Validation pour Mboa Drive

Ce document récapitule toutes les étapes nécessaires pour configurer l'API Google, valider l'application et gérer l'authentification cross-platform.

## 1. Google Cloud Console (Configuration Initiale)

### 1.1 Création du Projet
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un nouveau projet nommé **Mboa Drive**.

### 1.2 Activation de l'API
1. Recherchez **"Google Drive API"**.
2. Cliquez sur **Activer**.

### 1.3 Écran de consentement OAuth
1. Allez dans **APIs & Services > OAuth consent screen**.
2. Choisissez **External**.
3. Remplissez les informations de base :
   - **App name** : Mboa Drive
   - **Support email** : Votre email
   - **Developer contact** : Votre email
4. **Scopes** : Ajoutez `https://www.googleapis.com/auth/drive.file` (accès aux fichiers créés par l'app).

---

## 2. Branding & Validation (Étape Critique)

Google impose des règles strictes pour que votre application ne soit pas bloquée avec un message d'avertissement.

### 2.1 Critères du Branding (OAuth Consent Screen)
1. **Nom de l'application** : `Mboa Drive` (Doit correspondre exactement au nom dans la console).
2. **Logo de l'application** :
   - Utilisez le fichier `frontend/web/public/logo.png`.
   - **Important** : Google peut demander une validation manuelle si vous changez le logo après la validation initiale.
3. **Coordonnées** : L'email de support doit être un email que vous consultez régulièrement.

### 2.2 Validation du Domaine (Site Web)
C'est ici que l'erreur "Le site n'est pas enregistré à votre nom" survient souvent.
1. **Lien Accueil** : `https://arlong-gamma.vercel.app`
2. **Méthode de vérification** :
   - Le fichier `frontend/web/public/googlef0892b997568f046.html` est votre clé.
   - Si Google demande une nouvelle vérification, vérifiez que ce fichier est bien accessible publiquement via votre URL.

### 2.3 Procédure Google Search Console (Détails)
Pour lier définitivement votre site à votre compte Google :
1. Connectez-vous à la [Google Search Console](https://search.google.com/search-console/).
2. Choisissez **"Ajouter une propriété"** et sélectionnez **"Préfixe de l'URL"**.
3. Entrez : `https://arlong-gamma.vercel.app`.
4. Sélectionnez la méthode **"Fichier HTML"**.
5. Google vous fournira un nom de fichier (ex: `googlef0892b997568f046.html`).
   - *Note : Nous avons déjà créé ce fichier dans le projet.*
6. Cliquez sur **VÉRIFIER**. 
7. Une fois le message "Propriété vérifiée" affiché, la console Google Cloud reconnaîtra automatiquement votre domaine sans erreur.

### 2.3 Pages Légales Publiques
Google vérifie manuellement que ces liens fonctionnent et contiennent le nom de votre application :
- **Privacy Policy** : `https://arlong-gamma.vercel.app/privacy`
- **Terms of Service** : `https://arlong-gamma.vercel.app/terms`
- **Note** : Ces pages sont gérées dans `frontend/web/src/pages/Legal/`.

---

## 3. Architecture Cross-Platform Indépendante

Nous avons rendu les trois interfaces (Web, Mobile, Desktop) totalement indépendantes pour éviter qu'une modification sur l'une n'endommage les autres.

### 3.1 Identifiants de Plateforme
Chaque frontend utilise un paramètre unique lors de la demande d'authentification :
- **Web** : `/auth/google/url?platform=web`
- **Mobile** : `/auth/google/url?platform=mobile`
- **Desktop** : `/auth/google/url?platform=desktop`

### 3.2 Réponses Backend Personnalisées
Le backend (`backend/src/routes/auth.routes.js`) traite le retour de Google différemment :
- **Web/Desktop** : Envoie un `postMessage` à la fenêtre parente et se ferme automatiquement.
- **Mobile** : Affiche une interface dédiée **"Mboa Drive MOBILE"** avec un bouton de retour, évitant ainsi les erreurs de fenêtres orphelines sur smartphone.

---

## 4. Maintenance & Evolution
Si vous souhaitez modifier le design du frontend Mobile :
1. Modifiez uniquement `frontend/mobile/src/...`.
2. Le flux d'authentification restera stable car le backend reconnaît l'ID `mobile`.

---

### 🚀 État Actuel : VALIDÉ
Votre branding est actuellement **Validé** dans la console Google. Ne modifiez pas les URLs de redirection ou le logo sans prévoir une nouvelle période de validation de 2-3 jours par les équipes de Google.
