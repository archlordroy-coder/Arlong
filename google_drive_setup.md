# Guide de Configuration Google Drive pour Mboa Drive (Mode Multi-Utilisateurs & Hors-Ligne)

> [!IMPORTANT]
> Chaque utilisateur authentifié sur l'application Mboa Drive stockera ses documents **sur son propre Google Drive personnel**, dans un dossier nommé "Mboa Drive". L'application agit ainsi avec un maximum de confidentialité, l'administrateur n'ayant aucunement accès aux fichiers des utilisateurs.
> 
> **VUE HORS-LIGNE** : L'application (en Web, Desktop ou Mobile) permet par défaut à l'utilisateur de stocker ses fichiers **localement sur son appareil**. La synchronisation avec le Google Drive ne s'opère que lorsque l'appareil dispose d'une connexion internet et qu'un compte Google est lié.

## Étape 1 : Créer un Projet Google Cloud (Par l'Administrateur)

Cette étape est faite **une seule fois** par l'administrateur afin de déclarer l'application "Mboa Drive".

1. Aller sur [https://console.cloud.google.com](https://console.cloud.google.com)
2. Cliquez sur le menu déroulant en haut (sélecteur de projet) → **"Nouveau projet"**
3. Nom du projet : `Mboa Drive`
4. Cliquez sur **"Créer"** et attendez quelques secondes.

---

## Étape 2 : Activer l'API Google Drive

1. Dans le menu de gauche → **"API et services"** → **"Bibliothèque"**
2. Rechercher `Google Drive API`
3. Cliquer sur le résultat → **"Activer"**

---

## Étape 3 : Configurer l'Écran de Consentement OAuth

> [!WARNING]
> C'est ici que vous définissez ce que les utilisateurs verront quand Mboa Drive demandera accès à leur Drive. Ne demandez *que* l'accès aux fichiers créés par l'app.

1. Menu gauche → **"API et services"** → **"Écran de consentement OAuth"**
2. Choisir **"Externe"**
3. Remplir les champs obligatoires :
   - **Nom de l'application** : `Mboa Drive`
   - **E-mail d'assistance** : votre e-mail
   - **E-mail du développeur** : votre e-mail
4. Cliquer **"Enregistrer et continuer"**
5. Sur l'écran **"Portées"**, cliquer **"Ajouter ou supprimer des portées"**
   - Rechercher `drive.file` et cocher `/auth/drive.file` (Ceci est le scope permettant à l'app de ne voir et modifier QUE les fichiers qu'elle a créé elle-même).
   - Cliquer **"Mettre à jour"** puis **"Enregistrer et continuer"**
6. Sur l'écran **"Utilisateurs test"** :
   - Ajoutez des e-mails si l'application est "Non publiée" (mode test). Pour la production globale, vous devrez publier l'application.

---

## Étape 4 : Créer les Identifiants OAuth2

1. Menu gauche → **"API et services"** → **"Identifiants"**
2. Cliquer **"+ Créer des identifiants"** → **"ID client OAuth"**
3. Type d'application : **"Application Web"**
4. Nom : `Mboa Drive Backend`
5. **"URI de redirection autorisés"** → cliquer **"+ Ajouter un URI"** et entrer l'adresse de votre API Backend :
   - Pour le développement local : `http://localhost:5000/api/auth/google/callback`
   - **Lors du déploiement public** : ajoutez votre vraie adresse (ex: `https://api.monsite.com/api/auth/google/callback` ou `https://monsite.com/api/auth/google/callback` selon votre hébergement central). Les applications Mobile et Desktop n'ont pas besoin de leur propre adresse de redirection, elles communiquent avec ce serveur central.
6. Cliquer **"Créer"**
7. Vous obtenez un **Client ID** et **Client Secret** !

---

## Étape 5 : Configurer le serveur (`.env`)

Dans le fichier `.env` de votre backend, renseignez *uniquement* ces informations (il n'y a plus de refresh_token global) :

```env
GOOGLE_CLIENT_ID="123456789-xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
```

---

## Étape 6 : Comment l'utilisateur lie son compte ? (Le Flux Utilisateur)

1. L'utilisateur s'inscrit sur l'application Web Mboa Drive.
2. Il clique sur un bouton **"Lier mon Google Drive"** dans les paramètres de son compte.
3. L'application appelle `GET /api/auth/google/url`.
4. Le Backend renvoie le lien Google d'autorisation.
5. L'utilisateur accepte sur la page Google.
6. Google redirige vers `GET /api/auth/google/callback`.
7. Le Backend échange le code, obtient un `refresh_token` pour cet utilisateur, et le sauvegarde dans la table de base de données liée à son identifiant !

---

## Étape 7 : Fonctionnalité "Offline First" (Stockage Appareil & Synchronisation)

Afin d'assurer que l'application soit robuste même sans connexion internet ou avant la liaison Drive :

1. **Stockage Local (Dossier Mboa Drive)** : Si l'utilisateur numérise ou ajoute un document (images, PDF) lorsqu'il est hors connexion, le fichier est **sauvegardé physiquement sur son appareil**. 
   - L'application crée un dossier réel nommé **"Mboa Drive"** directement sur le support de stockage local de l'utilisateur (mémoire interne du mobile via Capacitor, ou dossier structuré sur Desktop via Electron).
   - Sur la version strictement Web (navigateur classique), le stockage s'effectuera via le cache persistant (*IndexedDB*).
2. **File d'attente (Queue)** : Le Frontend marque ces images et PDFs avec l'état `en attente de synchronisation`.
3. **Synchronisation Automatique** : Dès que l'application détecte un retour réseau (événement `online`) et que le compte utilisateur est lié, elle expédie les fichiers locaux de ce dossier "Mboa Drive" en arrière-plan vers l'API Backend.
4. **Finalisation** : Le Backend reçoit les fichiers (images, PDF), les uploade sur le Google Drive de l'utilisateur, et notifie le Frontend du succès. L'application locale marque le statut comme synchronisé, permettant de libérer l'espace fichier si nécessaire.
