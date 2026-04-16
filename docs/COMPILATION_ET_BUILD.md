# Processus de Compilation et d'Automatisation (CI)

Afin qu'Mboa Drive devienne une suite d’applications achevées, le code doit être impérativement compilé.

## 1. L'Automatisation dans le Cloud via GitHub Actions

Plutôt que compiler localement ce qui est dépendant des systèmes d’exploitation du développeur, tout repose dans le dossier `.github/workflows/`. Le but de ces fichiers Yaml est d'ordonner aux machines distantes de GitHub d'installer les dépendances listées dans `package.json` et générer les exécutables finaux.

Trois pipelines autonomes en découlent :
1. **`windows.yml`** : Lance spécifiquement une machine système Windows Cloud (`runs-on: windows-latest`), puis exécute `npx electron-builder build --win` pour extraire un `.exe`.
2. **`desktop.yml`** (Linux) : Lance un environnement Ubuntu (`runs-on: ubuntu-latest`) et produit un package exécutable portable `.AppImage`.
3. **`mobile.yml`** (Android) : Crée une sous-machine possédant JDK 21 (Java) et un moteur Gradle avant de lancer `build-apk.sh`.

> [!CAUTION]
> **Le Piège des "Node_modules"** 
> Puisque le code des dossiers Desktop & Mobile hérite en réalité de l'outil Web (ex: appels aux fichiers `frontend/web/src/App.tsx`), il est **obligatoire** de forcer les Actions GitHub à `npm install` les fichiers depuis `/web` pendant la compilation, sans quoi le module `react-router-dom` crashera et plantera la racine du transpilateur !

## 2. Mécanique de la Compilation Android : `build-apk.sh`

L'élaboration de la version `APK` nécessite une logistique délicate par rapport aux autres plateformes :
1. Il produit en premier lieu le dossier complet minimifié du site web `/dist` avec `npm run build`.
2. Il utilise ensuite `npx cap sync android` : Cette commande Capacitor détecte ce fameux `dist` injecte les assets web au contact du code orienté natif Java/Kotlin en l'écrasant.
3. Il modifie dynamiquement par Bash (via un regex sur les URLs) la méthode de récupération originelle de Gradle (`gradle-wrapper.properties`).
	 - S'il est sur Github, le script force l'abandon de l'archive `zip` de 150 Mo localement traquée pour se coordonner avec l'URL en direct `services.gradle.org` et télécharger proprement la version **8.13 imposée** de Gradle et empêcher les bugs sur Java 21. 
4. Une fois l'environnement parfait, il lance la routine `./gradlew assembleDebug` du SDK natif Android pour formuler le ficher Android Package (`.apk`).
