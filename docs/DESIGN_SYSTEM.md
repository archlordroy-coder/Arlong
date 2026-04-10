# 🎨 Arlong Design System : Aura Glassmorphism

Ce document sert de référence technique pour les développeurs frontend travaillant sur Arlong (Web et Mobile). L'objectif est de maintenir le standard esthétique de très haute qualité défini par le cahier des charges.

## 1. Philosophie Visuelle
L'application repose sur le "Aura Glassmorphism". Une combinaison de :
- Base extrêmement sombre pour faire ressortir les éléments (Dark Mode absolu).
- Panneaux translucides avec flou d'arrière-plan (`backdrop-filter: blur(16px)`).
- Bordures lumineuses très fines (`1px solid rgba(255, 255, 255, 0.05)`).
- Accents de couleurs fluo (Néon Indigo & Laser Cyan).
- Typographie ronde, élégante et lisible : **Plus Jakarta Sans**.

## 2. Variables CSS Globales (`index.css`)

Les couleurs sont définies à la racine. Ne surchargez **JAMAIS** les couleurs manuellement en dur (`#123456`). Utilisez toujours ces variables :

```css
/* Couleurs de fond */
var(--bg-base)       /* Le grand fond de l'app (Noir Absolu/Dark Indigo) */
var(--bg-surface)    /* Couleurs des blocsopaques */
var(--bg-glass)      /* rgba translucide (45%) pour le glassmorphism */
var(--bg-glass-hover)/* Plus dense au survol */

/* Accents (Boutons, Indicateurs) */
var(--primary)       /* Neon Indigo #6366F1 (Vos actions principales) */
var(--primary-glow)  /* Ombre portée Indigo */
var(--secondary)     /* Laser Cyan #06B6D4 (Vos actions secondaires) */

/* Textes */
var(--text-primary)  /* Textes forts (Titre) - Blanc teinté bleu */
var(--text-secondary)/* Textes courants - Gris ardoise clair */
var(--text-muted)    /* Textes discrets - Gris ardoise foncé */
```

## 3. Structure des Classes (Facilement Modifiable)

Les CSS sont écrits en CSS pur, modulaire, ce qui permet à tout intégrateur de changer un comportement sans impact ailleurs.

### Créer un panneau Glassmorphism parfait :
Ajoutez simplement la classe `.glass-panel` à une `div`.
```html
<div class="glass-panel">
  <h2>Mon Super Titre</h2>
  <p>Mon contenu textuel ici</p>
</div>
```

### Boutons standards :
```html
<button class="btn btn-primary">Action Forte</button>
<button class="btn btn-secondary">Action Secondaire</button>
<button class="btn btn-ghost">Action Fictive/Annulation</button>
```

### Grilles Dynamiques et Animation :
Consultez le fichier `tailwind-compat.css` qui liste les grilles (`.grid`, `.grid-cols-2`, `.flex`) et les animations (`.animate-fade-in`, `.animate-slide-up`).

## 4. Mobile : Floating Bottom Nav
La bottom navigation du mobile a été conçue pour être "flottante" via `MobileLayout.css`.
- Hauteur : `65px`
- Paddings et arrondis : `20px` (Pill shape)
- Marges de sécurité : Elle utilise le `env(safe-area-inset-bottom)` pour ne pas être recouverte par la barre iPhone ou les gestions gestuelles Android.

Pour ajouter un nouveau bouton : Mettez à jour le tableau `TABS` dans `MobileLayout.tsx`. La CSS de calcul d'espace (flex-1) placera l'icône automatiquement sans rien casser.
