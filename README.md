<p align="center">
  <img src="./logo.png" width="180" alt="Arlong Logo" />
</p>

<h1 align="center">Arlong System</h1>

<p align="center">
  <strong>Système Intégré de Gestion, Numérisation et Archivage d'Archives Multi-Plateforme</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.1-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/License-Proprietary-red.svg" alt="License" />
  <img src="https://img.shields.io/badge/Security-Supabase-green.svg" alt="Security" />
  <img src="https://img.shields.io/badge/Platform-Web%20|%20Mobile%20|%20Desktop-orange.svg" alt="Platforms" />
</p>

---

## 🌟 Présentation Générale

Arlong System est une solution logicielle robuste conçue pour répondre aux défis modernes de la gestion documentaire. Destinée aux entreprises et institutions, elle permet de **numériser**, **archiver**, **organiser** et **consulter** des documents papier ou numériques dans un environnement hautement sécurisé et performant.

Le projet se distingue par son approche **Universelle**, offrant une expérience fluide sur navigateurs Web, applications Mobiles (Android/iOS via Capacitor) et applications Desktop (Windows/Linux via Electron).

### 🎯 Objectifs de la plateforme
- **Numérisation Intelligente** : Scanner de haute qualité intégré avec reconnaissance de cadre.
- **Archivage Hiérarchique** : Organisation structurée par *Espaces* (Workspaces) et *Dossiers*.
- **Sécurité Critique** : Authentification Robuste (JWT & Supabase) et audit complet des actions utilisateur.
- **Multi-Cloud** : Liaison optionnelle avec **Google Drive** pour un stockage miroir personnel.
- **Design Premium** : Interface basée sur le concept d'Aura Glassmorphism (Dark mode, transparence, fluidité).

---

## 🏗️ Architecture Technique

Le projet est divisé en quatre piliers majeurs pour garantir une maintenance et une évolutivité maximale :

### 📡 Backend (`/backend`)
- **Runtime** : Node.js (Express.js)
- **Base de données & Auth** : [Supabase](https://supabase.com/) (PostgreSQL & GoTrue)
- **Stockage** : Intégration API Google Drive (OAuth2)
- **Middleware** : Validation de sécurité granulaire sur les documents (Droit de regard/édition).

### 📱 Frontend Mobile (`/frontend/mobile`)
- **Framework** : React + Vite
- **Pont Natif** : [Capacitor](https://capacitorjs.com/)
- **UI** : Pure CSS (BEM) - Sans Tailwind pour une performance maximale et une modification facilitée.
- **Plugins** : Status Bar, Keyboard, Fullscreen (Mode Immersif).

### 💻 Frontend Desktop (`/frontend/desktop`)
- **Framework** : React + Vite
- **Runtime** : [Electron](https://www.electronjs.org/)
- **Packaging** : Electron Builder (Sorties : `.exe`, `.AppImage`).

### 🌐 Frontend Web (`/frontend/web`)
- **Framework** : React + Vite
- **Déploiement** : Optimisé pour Vercel.

---

## 🛠️ Guide d'Installation (Développeurs)

### Pré-requis
- **Node.js** v24+
- **NPM** ou **PNPM**
- **Android Studio** (pour le build mobile local)
- **Git**

### 🏁 Lancement Rapide (Scripts Bash)
Nous avons simplifié le processus avec des scripts automatisés à la racine :

1.  **Installation globale** : 
    ```bash
    ./install-all.sh
    ```
2.  **Lancement du Backend (Dev)** :
    ```bash
    cd backend && npm run dev
    ```
3.  **Lancement du Web (Dev)** :
    ```bash
    ./start-web.sh
    ```
4.  **Lancement du Mobile (Browser Dev)** :
    ```bash
    ./start-mobile.sh
    ```

---

## 🎨 Design System : Aura Glassmorphism

L'application utilise une charte graphique propriétaire codée en **Pure CSS** (BEM) afin d'être totalement indépendante des frameworks utilitaires comme Tailwind. Cela permet à n'importe quel intégrateur de modifier le design simplement.

> [!IMPORTANT]
> **Règles d'or pour le Frontend :**
> 1. Ne pas utiliser de variables `:root`. Les couleurs sont injectées directement en Hexadécimal dans les fichiers `.css` pour plus de clarté visuelle lors de l'édition.
> 2. Respecter les arrondis (`radius-xl` = 1.5rem) et le flou (`blur(16px)`).
> 3. Consultez la documentation détaillée : [**DESIGN_SYSTEM.md**](./docs/DESIGN_SYSTEM.md).

---

## 📦 Compilation et Builds (CI/CD)

Le projet utilise **GitHub Actions** pour automatiser la génération des livrables à chaque `push` sur la branche `main`.

| Plateforme | Format | Workflow GitHub |
| :--- | :--- | :--- |
| **Android** | `.apk` | `mobile.yml` |
| **Linux** | `.AppImage` | `desktop.yml` |
| **Windows** | `.exe` | `windows.yml` |

### Build Manuel (Local)
- **APK Android** : Exécutez `./build-apk.sh`. L'APK sera généré dans `frontend/mobile/android/app/build/outputs/apk/debug/ARLONG.apk`.
- **Desktop** : Exécutez `npm run build:exe` dans le dossier `frontend/desktop`.

---

## 🔗 Intégration Google Drive & Deep Linking

Arlong utilise un flux de liaison sécurisé. 
1. L'utilisateur demande une URL de liaison.
2. Le backend génère une URL OAuth Google avec un `state` contenant l'ID utilisateur et la plateforme.
3. Après succès, l'utilisateur est redirigé :
   - **Verson Mobile** : Redirection vers `arlong://app/drive-success` (Deep Link).
   - **Version Web** : Redirection vers `https://arlong-gamma.vercel.app/dashboard`.

---

## 📂 Organisation de la Documentation

Pour approfondir des sujets spécifiques, veuillez consulter les documents suivants dans le dossier `/docs` :

1.  [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) : Détails techniques profonds.
2.  [**GOOGLE_OAUTH_VERIFICATION.md**](./docs/GOOGLE_OAUTH_VERIFICATION.md) : Configuration des clés API.
3.  [**PLUGINS_MOBILES.md**](./docs/PLUGINS_MOBILES.md) : Guide des fonctionnalités natives.
4.  [**MOBILE_NATIVE_GUIDE.md**](./docs/MOBILE_NATIVE_GUIDE.md) : Problématiques Capacitor/Android.

---

## 👥 Équipe Projet

- **Chef de Projet** : MR. LONCHI George
- **Développement Technique** : 
  - NGHOMSI FEUKOUO RAVEL (Matricule : 23V2011)
  - FOSSONG TSOFACK PATRICIA
  - MELI WILLIAM
  - SINENG KENGNI JUVENAL
  - NOE FOGAING DARCHEVY
  - TCHINDA FOGANG PIERRE LEGRAND
  - WOGUE DEFFO JEAN MARC

---
<p align="center">© 2026 Arlong Team. Tous droits réservés.</p>
