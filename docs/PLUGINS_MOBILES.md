# 📦 Documentation des Plugins Natifs — ARLONG Mobile

> Ce fichier documente tous les plugins Capacitor utilisés dans `frontend/mobile`. Toute modification d'un de ces plugins doit être consignée ici.

---

## Vue d'ensemble des plugins installés

| Plugin | Version | Rôle |
|---|---|---|
| `@capacitor/status-bar` | `^8.0.2` | Colore la barre système haute |
| `@capacitor/keyboard` | `^8.0.2` | Gestion du clavier virtuel |
| `@capacitor/splash-screen` | `^8.0.1` | Masque l'écran blanc au démarrage |
| `@capacitor/haptics` | `^8.0.2` | Vibration/retour haptique |
| `@boengli/capacitor-fullscreen` | `latest` | **Mode immersif : cache les 3 boutons Android** |

---

## 1. `@capacitor/status-bar`
### Rôle
Contrôle la barre de statut système en haut (heure, batterie, signal).

### Utilisation dans ARLONG
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

await StatusBar.setStyle({ style: Style.Dark });         // Icônes blanches sur fond sombre
await StatusBar.setBackgroundColor({ color: '#0d1117' }); // Fond assortit au thème de l'app
```

### Emplacement
`frontend/mobile/src/App.tsx` → fonction `initNativeFeatures()`

---

## 2. `@capacitor/keyboard`
### Rôle
Empêche que le clavier virtuel Android ne redimensionne le body, ce qui déformerait l'interface.

### Utilisation dans ARLONG
```typescript
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

await Keyboard.setResizeMode({ mode: KeyboardResize.None });
```

### Emplacement
`frontend/mobile/src/App.tsx` → fonction `initNativeFeatures()`

---

## 3. `@capacitor/splash-screen`
### Rôle
Contrôle l'écran de démarrage natif Android (l'écran affiché avant que React se charge).

### Utilisation dans ARLONG
```typescript
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';

// Masquer le splash natif une fois le contexte Auth chargé
CapSplashScreen.hide();
```

### Emplacement
`frontend/mobile/src/App.tsx` → `useEffect` sur `isLoading`

---

## 4. `@capacitor/haptics`
### Rôle
Déclenche le vibreur du téléphone pour donner un retour tactile sur les actions importantes.

### Utilisation recommandée
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Retour léger (clic sur un bouton)
await Haptics.impact({ style: ImpactStyle.Light });

// Retour fort (action critique, suppression)
await Haptics.impact({ style: ImpactStyle.Heavy });

// Notification de succès
await Haptics.notification({ type: NotificationType.Success });
```

> [!TIP]
> Utilisez `ImpactStyle.Light` sur les interactions normales.  
> Réservez `ImpactStyle.Heavy` pour les confirmations de suppression ou les alertes.

---

## 5. `@boengli/capacitor-fullscreen` ⭐ NOUVEAU
### Rôle
**Le plugin principal pour le mode immersif Android.**  
Il active le mode plein écran "Sticky Immersive" qui **cache définitivement les 3 boutons** du bas (Retour, Accueil, Récents).

Contrairement à `@capgo/capacitor-navigation-bar` (qui ne change que la couleur), ce plugin utilise les flags natifs Android `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` et `SYSTEM_UI_FLAG_HIDE_NAVIGATION`.

### Utilisation dans ARLONG
```typescript
import { Fullscreen } from '@boengli/capacitor-fullscreen';

// Activer le mode immersif (cache les 3 boutons)
await Fullscreen.activateImmersiveMode();

// Désactiver (les boutons réapparaissent) — rarement utile
await Fullscreen.deactivateImmersiveMode();
```

### Emplacement
`frontend/mobile/src/App.tsx` → fonction `initNativeFeatures()`

### Note comportement
Si l'utilisateur swipe depuis le bord inférieur de l'écran, les boutons réapparaissent **temporairement** (comportement Android standard "STICKY"), puis se masquent automatiquement.

---

## Ajouter un nouveau plugin

Pour ajouter un plugin Capacitor compatible Android :
```bash
cd frontend/mobile
npm install @capacitor/nom-du-plugin

# Après modification du code JS :
npx cap sync android
```

Mettez à jour ce fichier avec la description du nouveau plugin.

---

## Compatibilité requise

Tous les plugins doivent être en **version `^8.x`** pour être compatibles avec `@capacitor/core@^8.x`.

```bash
# Vérifier la cohérence de toutes les versions
cd frontend/mobile
npx cap doctor
```
