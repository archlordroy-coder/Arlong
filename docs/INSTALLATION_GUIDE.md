# 🛠️ Guide d'Installation de l'Écosystème Mboa Drive

Mboa Drive est divisé en quatre parties totalement indépendantes. Vous pouvez installer chaque partie séparément ou tout configurer d'un seul coup grâce aux scripts préparés pour vous.

## 🚀 Installation Globale (Recommandée)
Si vous souhaitez initialiser tout le projet sur votre machine, exécutez simplement cette commande à la racine du projet :

```bash
./install-all.sh
```
Ce script installera les dépendances racine, puis appellera automatiquement chaque installateur en cascade.

---

## 🧩 Installations Indépendantes

Si vous travaillez sur une version spécifique de l'application (par exemple, uniquement le frontend Mobile), inutile de tout installer. Utilisez le script approprié :

### 1. Backend (Serveur & API Supabase)
```bash
./scripts/install-backend.sh
```

### 2. Frontend Web (React + Vite)
```bash
./scripts/install-web.sh
```

### 3. Frontend Mobile (Android/IOS via Capacitor)
```bash
./scripts/install-mobile.sh
```
*(Note: assurez-vous d'avoir Java 17+ et Android Studio pour tester le mobile)*

### 4. Frontend Desktop (Electron, Windows/Linux)
```bash
./scripts/install-desktop.sh
```

---

## 🏗️ Lancement en Mode Développement

Une fois installé, vous pouvez lancer les interfaces individuellement via les commandes définies à la racine (grâce à `package.json` de la racine) :
- `npm run dev:backend` : Lance l'API locale
- `npm run start:web` : Lance la version Web
- `npm run start:mobile` : Lance la vue développeur du Mobile
- `npm run start:desktop` : Lance la vue développeur du Desktop

Ou tout lancer en même temps avec :
```bash
npm run dev
```
