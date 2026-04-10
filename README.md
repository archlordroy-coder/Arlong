# 🚀 Arlong System — Portail Documentation Pédagogique

Bienvenue dans le dépôt principal du projet **Arlong System** (Frontend Mobile/Web/Desktop & Backend). 
Ce projet a bénéficié d'une refonte structurelle, visuelle, et sécuritaire pour le rendre professionnel, multi-plateforme, et modulable.

Puisque de nouveaux développeurs (Front-end, Back-end ou Devops) vont reprendre le projet, ce fichier vous servira de **hub central** pour savoir quoi lire, dans quel ordre.

---

## 📖 Dans quel ordre lire la documentation ?

### 1️⃣ Je suis un nouveau développeur (tous rôles) : Que dois-je savoir ?
**Commencez par :**
1. [ARCHITECTURE.md](./docs/ARCHITECTURE.md) : Comprendre comment le projet est architecturé (séparation des frontends `mobile/`, `web/`, `desktop/` et du `backend/`).
2. [DEPENDENCES.md](./docs/DEPENDENCES.md) : Voir la liste des packages indispensables utilisés.
3. [INSTALLATION_GUIDE.md](./docs/INSTALLATION_GUIDE.md) : Procédure pour lancer le projet en local (bash scripts `install-all.sh`).

### 2️⃣ Je travaille sur l'Interface ou le Design (Dev Frontend)
L'application n'utilise **PLUS** TailwindCSS ou de classes utilitaires.
Nous avons migré vers une esthétique "Pure CSS BEM" (Variables dures, classes propres, composants isolés).
**Lisez absolument :**
1. [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) : Les règles d'or du thème **Aura Glassmorphism** (Codes couleurs, comment utiliser le mode transparent "Verre givré" et la typographie).
2. Code de Référence : Explorez les fichiers dans `frontend/mobile/src/pages/Dashboard/Dashboard.css` par exemple pour voir comment architecturer votre CSS.

### 3️⃣ Je dois recompiler l'application (APK, Desktop, Web)
**Lisez ces documents :**
1. [COMPILATION_ET_BUILD.md](./docs/COMPILATION_ET_BUILD.md) : Scripts shells pour générer l'APK Android (`build-apk.sh`) et l'AppImage (`build-electron.sh`).
2. [MOBILE_NATIVE_GUIDE.md](./docs/MOBILE_NATIVE_GUIDE.md) : Si vous rencontrez un problème avec Capacitor (ex: Le mode Immersif pour cacher la navbar Android).
3. [PLUGINS_MOBILES.md](./docs/PLUGINS_MOBILES.md) : Liste des plugins natifs et leur fonctionnement.

### 4️⃣ Je dois gérer l'authentification et l'API Google Drive
**Lisez cette documentation dans l'ordre de priorité :**
1. [GOOGLE_OAUTH_VERIFICATION.md](./docs/GOOGLE_OAUTH_VERIFICATION.md) : Explications du flux OAuth. (Domaine configuré : `arlong-gamma.vercel.app`).
2. Lors de la connexion, le backend (dans `auth.routes.js`) gère lui-même un Deep Link vers `arlong://app/drive-success` pour ramener l'utilisateur sur l'App native.
3. [API_SECURITE_GOOGLE.md](./docs/API_SECURITE_GOOGLE.md) : Droits sur les fichiers de l'utilisateur.

---

## 🛠️ Avancées Récentes Importantes (Changelog)
- **UI/UX :** Remplacement de toutes les variables CSS dynamiques par du code hexadécimal fixe (Hardcoding) dans plus de 20 fichiers pour faciliter le travail d'intégration direct sans variables. Tout est au format BEM.
- **Sécurité Fichiers :** Validation de sécurité lors du **déplacement** (`PUT /move`) et de la **suppression** (`DELETE /:id`) d'un document. Un utilisateur ne peut pas altérer le fichier d'un Espace qui ne lui appartient pas (vérification Back-end via req.user.id implémentée en dur).
- **Google OAuth :** Mise en place d'un callback dynamique. Si connecté sur l'app (mobile), Google vous renverra via Deep Linking (`arlong://`). Si sur Web, `https://arlong-gamma.vercel.app/dashboard`.

Bon développement ! 🚀
