# 📱 Guide des Plugins Natifs Mobile (Capacitor)

Pour que l'application Android/iOS construite avec Vite + React donne l'impression d'être une véritable application système, nous avons installé les plugins natifs de Capacitor.

## 1. La Barre d'État (`@capacitor/status-bar`)

**À quoi ça sert ?**
Permet de changer la couleur d'arrière-plan de la barre système (là où il y a l'heure et la batterie).
**Comment l'utiliser ?**
Idéalement dans votre composant d'entrée (ex: `App.tsx`) :
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Au lancement de l'application
const initNative = async () => {
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#0d1117' }); // Couleur de fond ARLONG
};
```

## 2. Le Clavier (`@capacitor/keyboard`)

**À quoi ça sert ?**
Empêche l'application Web d'être complètement déformée ou compressée quand le clavier virtuel s'ouvre.
**Comment l'utiliser ?**
Vous pouvez configurer son comportement ou l'écouter :
```typescript
import { Keyboard } from '@capacitor/keyboard';

// Désactiver le redimensionnement automatique du body (évite le scroll bug)
Keyboard.setResizeMode({ mode: KeyboardResize.None });
```

## 3. Retours Haptiques (`@capacitor/haptics`)

**À quoi ça sert ?**
Déclenche le vibreur du téléphone pour créer un "retour tactile" lors du clic sur des boutons importants (comme "Se connecter" ou la suppression d'une archive).
**Comment l'utiliser ?**
Ajoutez cela dans vos fonctions onClick :
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const handleClick = async () => {
  await Haptics.impact({ style: ImpactStyle.Light });
  // suite du code
};
```

## 4. L'Écran de Vrai Démarrage (`@capacitor/splash-screen`)

**À quoi ça sert ?**
Contrairement à l'écran de chargement en CSS pur, celui-ci empêche votre utilisateur de voir une page blanche pendant la milliseconde où l'application Javascript charge. Il bloque l'écran natif du téléphone, et vous demandez de le masquer une fois React prêt.
**Comment l'utiliser ?**
```typescript
import { SplashScreen } from '@capacitor/splash-screen';

// Dans App.tsx, quand vous savez que le composant est monté
useEffect(() => {
  SplashScreen.hide();
}, []);
```

---
*Ces plugins interagissent directement avec le téléphone physique. L'intégration de ces lignes de code permet d'immédiatement distinguer un simple site mobile d'une véritable application téléchargée.*
