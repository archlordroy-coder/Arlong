# Dépendances et Packages Utilisés

Pour recréer ou faire évoluer ce projet, il est capital de comprendre l'utilité exacte de chaque paquet installé.

## Dépendances Frontend (Interfaces UI)

- **`react` & `react-dom`** : Le cœur de l'affichage interactif. La structure composable au format JSX garantit de très bonnes performances.
- **`react-router-dom`** : Crucial pour naviguer entre les différentes vues (Architecture Single Page Application - SPA). *La synchronicité des versions de ce paquet entre les dossiers Web et Desktop/Mobile est vitale pour éviter les erreurs de modules Vite.*
- **`lucide-react`** : Bibliothèque d'icônes vectorielles personnalisables, exploitées dans les boutons d'interfaces et menus.
- **`date-fns`** : Remplace les méthodes natives obsolètes de gestion du temps pour formater, manipuler et convertir rapidement les dates des archives.

## Dépendances de Fonctionnalités & Métier

- **`axios`** : Pour gérer les requêtes HTTP (appels API vers le serveur Backend) de façon plus propre que le natif `fetch()`.
- **`localforage`** : Un wrapper puissant. Il permet d'enregistrer des bases de données volumineuses hors-ligne dans IndexedDB (plus grand et robuste que LocalStorage) afin de réaliser la mise en cache de l'application Mobile.
- **`jspdf`** : Totalement indispensable pour l'exportation et le traitement à la volée de documents au format PDF.

## Moteurs Cross-Platform (Compilation Interfaces)

- **`@capacitor/android`, `@capacitor/core`, `@capacitor/cli`** : Formule mobile. `core` fait le pont JS <-> Java, `android` maintient l'intégration Android Studio, `cli` exécute les commandes d'injection web pour la compilation.
- **`electron`, `electron-builder`** : La base du projet bureau. Electron intègre Node.js et Chromium. Builder gère l'architecture des systèmes pour transformer les fichiers sources finaux en exécutables (`.exe` interactif Microsoft et `.AppImage` portable Linux).

## Dépendances Backend (Infrastructure)

- **`express`** : Création du routeur serveur HTTP écoutant les requêtes.
- **`googleapis`** : Le SDK officiel massif permettant d'invoquer les fonctions des API Google Drive (Génération d'URLs, Uploads et Permissions).
- **`@supabase/supabase-js`** : Interagit avec la base de données PostgreSQL de Supabase en requêtes JavaScript asynchrones.
- **`jsonwebtoken` (JWT) & `bcryptjs`** : Couche de Sécurité ; `bcryptjs` hache le secret serveur avant base de données et JWT émet des signatures de flux permettant au backend de reconnaître un utilisateur.

## Outils de Build & Compilation Brute

- **`vite` & `@vitejs/plugin-react`** : Transpilateur hyper-rapide. Il lit les fichiers TS/TSX bruts développés, optimise leurs chemins et en fait de l'HTML/CSS/JS final pour production sans pertes de temps d'assemblage (`npm run build`).
