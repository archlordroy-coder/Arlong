# 🔒 Masquer la Barre de Navigation Android (Mode Immersif)

## Pourquoi JavaScript ne suffit pas ?

Lorsque l'APK est lancé, Android affiche ses 3 boutons (Retour, Accueil, Récents) par défaut.
Un plugin JS peut les cacher **après** le chargement de React, mais ils réapparaissent parfois au redémarrage de l'activité.

La **seule solution fiable et permanente** est native : modifier le **thème Android** directement.

---

## Solution : Activer le Mode Immersif via `themes.xml`

**Étape 1** : Assurez-vous que Capacitor a généré le dossier `android/` :
```bash
cd frontend/mobile
npx cap add android
```

**Étape 2** : Ouvrez le fichier :
```
frontend/mobile/android/app/src/main/res/values/themes.xml
```

**Étape 3** : Remplacez son contenu par :
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:windowBackground">@color/ic_launcher_background</item>

        <!-- Activer le mode plein écran immersif (cache les 3 boutons) -->
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
</resources>
```

**Étape 4** : Dans `MainActivity.java` (ou `.kt`), ajoutez ceci dans `onCreate()` :
```java
@Override
public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    getWindow().getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
    );
}
```

**Étape 5** : Rebuild l'APK :
```bash
# A la racine :
./build-apk.sh
```

---

## Résultat
- La barre avec les 3 boutons (Retour, Accueil, Récents) **disparaît complètement**.
- Si l'utilisateur swipe depuis le bord bas, les boutons réapparaissent temporairement, puis se cachent de nouveau automatiquement (`IMMERSIVE_STICKY`).
- L'app utilise **100% de la hauteur** de l'écran — idéal pour une expérience native premium.

---

## Contournement provisoire (sans modifier le natif)

En attendant de générer le dossier `android/`, le CSS utilise déjà `env(safe-area-inset-bottom)` dans `Home.css` pour éviter que le contenu soit caché **sous** la barre de navigation.
