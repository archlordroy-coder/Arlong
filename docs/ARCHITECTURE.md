# Architecture Technique : Mboa Drive / Mboa Drive

> [!TIP]
> Ce projet est conçu selon une architecture "Monorepo" légère, permettant de tout ranger dans un même dépôt Git tout en gardant une séparation stricte entre Backend et Frontend.

## 1. L'Espace Backend (`backend/`)

Le backend agit comme la passerelle centrale sécurisée entre vos clients (Web/Mobile) et les services externes. 

- **Structure** : C'est un serveur **Node.js + Express** localisé dans le dossier `backend/`. 
- **Bases de Données** : Il interagit avec **Supabase** via le client `@supabase/supabase-js`, ce qui permet de gérer les règles de bases de données, l'authentification et les profils utilisateurs.
- **Stockage Tiers** : Le service Google Drive est intégré via le package `googleapis` (notamment visible dans `backend/src/services/googleDrive.service.js`). Cela permet à l'application de manipuler, créer ou lire des documents d'archives directement depuis les serveurs de Google.

## 2. L'Espace Frontend (`frontend/`)

Il s'agit du cœur visuel du projet. Plutôt que de coder trois applications distinctes (une pour le navigateur, une pour Windows, et une pour Android), le framework **React** est partagé intelligemment comme base commune.

### 2.1. Le dossier `frontend/web/`
C'est la version primaire de l'application. Elle produit le site web complet. Elle est gérée et packagée par le moteur de compilation **Vite**.

### 2.2. Le dossier `frontend/desktop/`
Conçu pour transformer l'application Web en un vrai logiciel de bureau installable sur Windows (`.exe`) et utilisable sur Linux (`.AppImage`).
- **Principe** : Il utilise **Electron**. Ce programme démarre un navigateur interne invisible (géré dans `electron/main.cjs`) qui charge le code compilé de votre interface React.
- **Vite** est également utilisé ici pour construire le "bundle" React, qui sera ensuite pris en charge et encapsulé par `electron-builder`.

### 2.3. Le dossier `frontend/mobile/`
Gère l'évolution de la plateforme sur téléphone (Application Android).
- **Principe** : Il utilise **Capacitor**, une technologie de "pont". Capacitor prend le résultat du site web React (le dossier `dist/`) et l'emballe dans une application native Android (concept WebView) tout en lui offrant accès aux fonctions matérielles du téléphone à travers Java/Kotlin.
- Ce dossier contient le sous-projet officiel Android Studio en interne (manipulé par des requêtes de type `npx cap sync android`).
