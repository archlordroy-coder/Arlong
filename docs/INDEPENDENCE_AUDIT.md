# 🛡️ Rapport d'Audit : Indépendance des Interfaces Mboa Drive

Ce document explique les mesures prises pour garantir que les versions Web, Mobile et Desktop sont techniquement indépendantes.

## 1. Isolation des Workflows (CI/CD)
Précédemment, les builds Mobile et Desktop installaient les dépendances du projet Web par erreur. 
- **Action** : Les fichiers `.github/workflows/mobile.yml`, `desktop.yml` et `windows.yml` ont été nettoyés.
- **Résultat** : Un changement de dépendance ou une erreur dans `frontend/web` ne bloquera plus la compilation de l'APK ou de l'exécutable Desktop.

## 2. Découplage de l'Authentification
Chaque frontend s'identifie désormais de manière unique auprès du backend.
- **Paramètre** : `?platform=[web|mobile|desktop]`
- **Conséquence** : Vous pouvez modifier la logique de retour d'authentification pour le Web sans impacter la version Mobile. Le backend gère chaque cas de manière isolée.

## 3. Structure des Fichiers
Chaque interface possède son propre dossier `src/api/client.ts` et son propre `vite.config.ts`. 
- **Conseil** : Pour maintenir cette indépendance, évitez de créer des liens symboliques (symlinks) entre les dossiers de frontend.
