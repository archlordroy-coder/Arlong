# Arlong / ARLONG 🚀

Un système avancé de gestion d'archives multiplateforme (Web, Desktop, Mobile) avec synchronisation Cloud.

## Présentation

Arlong (nom de code projet : ARLONG) est conçu pour gérer efficacement les documents en combinant une interface réactive avec une architecture centralisée. Le projet repose sur un socle React/Vite distribué intelligemment sur trois plateformes :
- **Web** : Accessible via n'importe quel navigateur (hébergé sur Vercel/Supabase).
- **Desktop (Windows/Linux)** : Application native propulsée par Electron et compilée en `.exe` et `.AppImage`.
- **Mobile (Android)** : Application embarquée grâce à Capacitor et distribuée en `.apk`.

## Stack Technologique

- **Frontend** : React 19, Vite, TailwindCSS / Vanilla CSS, React Router v6/v7.
- **Backend APIs** : Node.js (Express), intégration Supabase (PostgreSQL, Auth), et API Google Drive.
- **Bridges Natifs** : Electron (Desktop), Capacitor 8 (Mobile).
- **DevOps & CI/CD** : GitHub Actions pour automatiser les compilations multiplateformes.

## Démarrage Rapide (Environnement local)

> [!IMPORTANT]
> Assurez-vous d'avoir Node.js (v24 recommandé), Java 21, et Gradle d'installés sur votre machine avant de démarrer.

1. **Cloner le projet** et installer les dépendances :
   ```bash
   npm install
   ```

2. **Démarrer simultanément le Backend et le Frontend Web** :
   ```bash
   npm run dev
   ```

3. **Lancer les plateformes spécifiques** :
   - Web seul : `npm run start:web`
   - Mobile PWA local : `npm run start:mobile`
   - Desktop Electron local : `npm run start:desktop` puis `npm run start:electron`

## Index de la Documentation Technique

Dans le dossier `docs/` vous trouverez toutes les informations nécessaires pour recréer ou maintenir ce projet de zéro :

- 🏗️ [**Architecture (Backend & Frontend)**](./docs/ARCHITECTURE.md) : Comprendre comment les différents dossiers interagissent.
- 📦 [**Dépendances et Bibliothèques**](./docs/DEPENDENCES.md) : Pourquoi et comment chaque package de compilation a été choisi.
- ⚙️ [**Compilation et Build**](./docs/COMPILATION_ET_BUILD.md) : La magie de GitHub Actions, Electron builder, et Capacitor.
- 🔑 [**Clés API et Sécurité Google**](./docs/API_SECURITE_GOOGLE.md) : Démarche cruciale pour obtenir les clés API et éviter les blocages de sécurité par Google.
