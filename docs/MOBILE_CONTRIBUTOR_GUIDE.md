# 📱 Guide du Contributeur — Frontend Mobile (ARLONG)

> **À lire impérativement avant toute modification du code de `frontend/mobile`.**  
> Ce document explique l'architecture, les règles et les précautions à respecter pour travailler sur la version mobile sans casser ce qui existe déjà.

---

## 1. Architecture du projet Mobile

Le frontend mobile est un projet **React + Vite** emballé dans une APK via **Capacitor**. Il vit dans son propre dossier **complètement indépendant** des autres frontends :

```
frontend/
├── web/         ← 🌐 Version navigateur (React standard)
├── desktop/     ← 🖥️  Version bureau (Electron)
└── mobile/      ← 📱 CE DOSSIER — Version Android (Capacitor)
    ├── src/
    │   ├── api/client.ts         ← Client Axios (NE PAS MODIFIER l'URL de prod)
    │   ├── contexts/AuthContext.tsx ← Gestion de l'authentification
    │   ├── components/           ← Composants réutilisables
    │   └── pages/                ← Écrans de l'application
    ├── package.json              ← Dépendances ISOLÉES (ne pas toucher sans lire §3)
    ├── vite.config.ts            ← Config Vite (ne pas modifier sans raison)
    ├── index.html                ← Viewport mobile configuré (ne pas modifier)
    └── App.tsx                   ← Point d'entrée + init native Capacitor
```

> [!WARNING]
> **`frontend/mobile/src` est un vrai dossier physique**, pas un raccourci vers `web/`.  
> Ne jamais recréer de symlink (`ln -s`) vers un autre dossier frontend.

---

## 2. Règles fondamentales à respecter

### ✅ Ce que vous pouvez faire librement
- Modifier le **style** d'une page (`.css` ou styles inline dans le `.tsx`)
- Ajouter une nouvelle page dans `src/pages/`
- Ajouter un nouveau composant dans `src/components/`
- Modifier le texte ou la traduction d'une interface
- Ajuster les routes dans `App.tsx`

### ❌ Ce qu'il ne faut PAS faire sans consultation
| Action interdite | Raison |
|---|---|
| Modifier `src/api/client.ts` | Casse les URLs pointant vers Vercel |
| Modifier `App.tsx` (les lignes d'init native) | Les plugins Capacitor (StatusBar, Keyboard, NavigationBar) doivent rester initialisés |
| Modifier `package.json` manuellement | Risque de conflits de version avec les plugins Capacitor |
| Copier des fichiers depuis `frontend/web/src/` | Chaque frontend est indépendant intentionnellement |
| Changer le meta `viewport` dans `index.html` | Configuré précisément pour l'écran mobile |

---

## 3. Ajouter ou changer une dépendance npm

Toujours se placer dans le bon dossier :
```bash
cd frontend/mobile
npm install [nom-du-paquet]
```

> [!IMPORTANT]
> N'utilisez **jamais** `npm install` à la racine `/driverx/` pour le mobile — cela ajouterait la dépendance au mauvais `package.json`.

Pour les **plugins Capacitor**, toujours vérifier la compatibilité avec la version actuellement installée :
```bash
npx cap doctor
```
La version Capacitor cible est **`^8.x`**. Ne pas installer de plugin en version `5.x` ou `6.x`.

---

## 4. Plugins natifs installés (NE PAS DÉSINSTALLER)

Ces paquets sont **requis** pour que l'APK se comporte comme une vraie application native :

| Paquet | Rôle |
|---|---|
| `@capacitor/status-bar` | Colore la barre système haute (heure/batterie) aux couleurs d'ARLONG |
| `@capacitor/keyboard` | Empêche le clavier virtuel de déformer l'interface |
| `@capacitor/splash-screen` | Masque l'écran blanc natif au démarrage |
| `@capacitor/haptics` | Retour haptique (vibreur) sur les actions importantes |
| `@capgo/capacitor-navigation-bar` | Rend la barre de navigation Android transparente |

Tous ces plugins sont initialisés dans **`src/App.tsx`**. Ne supprimez pas ces lignes.

---

## 5. Système de style : CSS pur (pas de Tailwind)

Le projet mobile **n'utilise pas Tailwind CSS**. Le styling repose sur :

1. **Variables CSS globales** dans `src/index.css` (couleurs, espacements, ombres)
2. **Fichiers CSS locaux** à chaque page (ex: `pages/Home.css`, `pages/Settings/Settings.css`)

### Règle de style

Chaque nouvelle page doit avoir **son propre fichier `.css`** importé localement :
```tsx
// Dans MonEcran.tsx
import './MonEcran.css';
```

Utilisez **exclusivement les variables CSS** définies dans `index.css` :
```css
/* ✅ Correct */
color: var(--text-primary);
background: var(--bg-glass);

/* ❌ Interdit */
color: #F8FAFC;
background: rgba(21, 26, 34, 0.6);
```

---

## 6. Flux d'authentification (NE PAS CASSER)

Le mobile envoie le paramètre `?platform=mobile` lors de la liaison Google Drive.  
Ce paramètre est lu par le backend pour adapter sa réponse.

```typescript
// Settings.tsx — NE PAS CHANGER CE PARAMÈTRE
const res = await api.get('/auth/google/url?platform=mobile');
```

La page `Settings.tsx` écoute aussi le message `drive-linked` pour **auto-recharger** l'application après la liaison :
```typescript
window.addEventListener('message', handleMessage);
```
Ne pas supprimer cet écouteur.

---

## 7. Avant de committer vos changements

```bash
# 1. Vérifiez que le build React se compile sans erreur
cd frontend/mobile
npm run build

# 2. Vérifiez qu'il n'y a pas de dépendances manquantes
npx depcheck

# 3. Si tout est ok, committez
git add .
git commit -m "feat(mobile): description de votre changement"
```

---

## 8. Comment tester sur Android

```bash
# 1. Builder le frontend React
npm run build

# 2. Synchroniser les fichiers avec le projet Android natif
npx cap sync android

# 3. Ouvrir dans Android Studio pour tester
npx cap open android
```

Ou utiliser le script automatisé à la racine du projet :
```bash
./build-apk.sh
```
