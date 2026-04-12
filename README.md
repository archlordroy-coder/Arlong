<p align="center">
  <img src="./logo.png" width="220" alt="Mboa Drive Logo" />
</p>

<h1 align="center">📘 Mboa Drive — L'Écosystème d'Archivage Ultime</h1>

<p align="center">
  <strong>Une plateforme unifiée haute performance pour la gestion, le scan et la sécurisation d'archives numériques.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Clean%20BEM-blue.svg" alt="Architecture" />
  <img src="https://img.shields.io/badge/Core-React%20%2B%20Vite-61dafb.svg" alt="Techno" />
  <img src="https://img.shields.io/badge/CI%2FCD-Node%2024-green.svg" alt="CI" />
  <img src="https://img.shields.io/badge/Security-Supabase%20%2B%20JWT-3ecf8e.svg" alt="Auth" />
</p>

---

## 📖 Sommaire
1. [Vision du Projet](#-vision-du-projet)
2. [Fonctionnalités Clés](#-fonctionnalités-clés)
3. [Stack Technologique Complète](#-stack-technologique-complète)
4. [Architecture du Mono-repo](#-architecture-du-mono-repo)
5. [Guide d'Installation et Redémarrage](#-guide-dinstallation-et-redémarrage)
6. [Liaison Google Drive & OAuth](#-liaison-google-drive--oauth)
7. [Documentation Interne (Index Complet)](#-documentation-interne-index-complet)
8. [Build & Déploiement CI/CD](#-build--déploiement-cicd)
9. [Design System : Aura Glassmorphism](#-design-system--aura-glassmorphism)
10. [Équipe Technique](#-équipe-technique)

---

## 🌟 Vision du Projet
Mboa Drive n'est pas qu'un simple gestionnaire de fichiers. C'est un **coffre-fort numérique intelligent** qui fait le pont entre vos documents physiques (via son scanner mobile haute résolution) et vos espaces de stockage cloud. 

**Pourquoi Mboa Drive ?**
- **Souveraineté des données** : Vos documents sont sur votre Drive et gérés via notre interface chiffrée.
- **Accessibilité Totale** : Une seule base de code pour gérer votre WebApp, votre version de bureau et votre app mobile.
- **Esthétique Moderne** : Un design épuré, sombre et immersif qui réduit la fatigue visuelle.

---

## ✨ Fonctionnalités Clés
- 📸 **Scanner Intelligent** : Détection automatique des bords et optimisation des contrastes pour les documents papier.
- 📁 **Gestion Multi-Niveaux** : Organisation par Espaces de travail et Dossiers illimités.
- 🔐 **Sécurité Granulaire** : Contrôle total sur qui peut voir ou modifier chaque archive.
- ☁️ **Mirroring Google Drive** : Sauvegarde automatique de vos archives sur votre espace personnel.
- 🔍 **Audit complet** : Historique détaillé de chaque consultation, téléchargement et importation.
- 🚀 **Performance Native** : Optimisation Capacitor pour mobile et Electron pour Desktop.

---

## 💻 Stack Technologique Complète

### Backend (Le Cœur logicielle)
- **Node.js 24+** : Serveur asynchrone ultra-rapide.
- **Express.js** : Framework web minimaliste.
- **Supabase** : PostgreSQL pour les données, GoTrue pour l'authentification sécurisée.
- **Google OAuth2** : Gestion des accès tiers.

### Frontend (L'Interface Universelle)
- **React 18** : Composants modulaires.
- **Vite** : Bundleur de nouvelle génération 10x plus rapide que Webpack.
- **Lucide Icons** : Pack d'icônes vectoriels légers.
- **Capacitor** : Pont natif pour Android (Android Studio) et iOS (Xcode).
- **Electron** : Enveloppe bureau pour Linux/Windows.

---

## 🏗️ Architecture du Mono-repo
Le projet est organisé pour faciliter la collaboration :
```text
Mboa Drive/
├── backend/             # API REST (Supabase Connector, Google Drive Service)
├── docs/                # 📚 TOUTE LA DOCUMENTATION TECHNIQUE
├── frontend/
│   ├── mobile/          # Client Android (Source Capacitior)
│   ├── web/             # Client Navigateur (Déployé sur Vercel)
│   └── desktop/         # Client Bureau (Source Electron)
├── scripts/             # Utilitaires de maintenance (Installation, Start)
├── build-apk.sh         # Script unique de compilation Android
└── README.md            # Ce fichier
```

---

## 🚀 Guide d'Installation et Redémarrage

### Localhost Rapide
Pour installer tout l'écosystème en une commande :
```bash
chmod +x scripts/*.sh
./scripts/install-all.sh
```

### Lancer les services simultanément
Utilisez des terminaux séparés pour :
1. **API** : `cd backend && npm run dev`
2. **WEB** : `cd frontend/web && npm run dev`
3. **MOBILE** : `cd frontend/mobile && npm run dev`

---

## 🔐 Liaison Google Drive & OAuth

La gestion de Google Drive est l'élément le plus sensible d'Mboa Drive. 

**Processus technique :**
1. **Console Google Cloud** : Le domaine `arlong-gamma.vercel.app` est enregistré comme domaine autorisé.
2. **Flux OAuth** : Le Backend initie la demande avec les scopes `drive.file` et `drive.metadata.readonly`.
3. **Callback Callback** : Le serveur redirige dynamiquement via Deep Linking sur mobile (`mboadrive://`) ou via URL sur le web.

👉 **Lire le guide d'authentification complet** : [GOOGLE_OAUTH_VERIFICATION.md](./docs/GOOGLE_OAUTH_VERIFICATION.md)

---

## 📚 Documentation Interne (Index Complet)

Nous avons documenté chaque aspect pour les futurs repreneurs du projet :

| Sujet | Fichier | Description |
| :--- | :--- | :--- |
| **Général** | [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Structure globale du projet. |
| **Général** | [INSTALLATION_GUIDE.md](./docs/INSTALLATION_GUIDE.md) | Guide pas à pas pour le setup. |
| **Frontend** | [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | **IMPORTANT** : Guide du BEM CSS et couleurs Aura. |
| **Mobile** | [PLUGINS_MOBILES.md](./docs/PLUGINS_MOBILES.md) | Tout sur Capacitor et le matériel (Caméra, GPS). |
| **Mobile** | [ANDROID_IMMERSIVE_MODE.md](./docs/ANDROID_IMMERSIVE_MODE.md) | Comment cacher les boutons Android natifs. |
| **Google** | [GOOGLE_FULL_GUIDE.md](./docs/GOOGLE_FULL_GUIDE.md) | **ULTIME** : Du Cloud Console au déploiement final. |
| **Devops** | [COMPILATION_ET_BUILD.md](./docs/COMPILATION_ET_BUILD.md) | Scripts de génération d'APK et EXE. |
| **Sécurité** | [API_SECURITE_GOOGLE.md](./docs/API_SECURITE_GOOGLE.md) | Gestion des permissions API Drive. |

---

## 📦 Build & Déploiement CI/CD

Chaque commit déclenche un workflow GitHub :
- **🟢 Vert** : Prêt pour la production.
- **🔴 Rouge** : Problème de typage ou de script (Checkez `tsc` ou `vite build`).

**Compilation Android manuelle :**
```bash
./build-apk.sh
```
*L'APK sera disponible dans `frontend/mobile/android/app/build/outputs/apk/debug/`.*

---

## 🎨 Design System : Aura Glassmorphism
Mboa Drive a abandonné TailwindCSS pour un système de design **Pure CSS**.
- **Couleur Primaire** : `#6366F1` (Neon Indigo)
- **Fond Base** : `#090A0F`
- **Effet Verre** : `rgba(18, 20, 29, 0.45)` avec `backdrop-filter: blur(16px)`

Toutes les couleurs sont injectées "en dur" dans les fichiers CSS de chaque composant pour permettre une maintenance directe sans fichiers de configuration complexes.

---

## 👥 Équipe Technique

- **George LONCHI** — Chef de Projet
- **RAVEL NGHOMSI FEUKOUO** — Lead Developer (Architecte Fullstack)
- **PATRICIA FOSSONG TSOFACK** — Développeuse
- **WILLIAM MELI** — Développeur
- **JUVENAL SINENG KENGNI** — Développeur
- **DARCHEVY NOE FOGAING** — Développeur
- **PIERRE LEGRAND TCHINDA FOGANG** — Développeur
- **JEAN MARC WOGUE DEFFO** — Développeur

---
<p align="center">Made with ❤️ for Mboa Drive © 2026</p>
