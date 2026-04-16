# 🔧 Solution : Correction de la Redirection Auth sur APK

## Problème rencontré
Lors de la liaison au compte Google Drive depuis l'APK, l'utilisateur était redirigé vers `http://localhost:5000/...`, ce qui provoquait une erreur "Page non trouvée" sur mobile.

## Cause
Le backend utilisait une variable d'environnement fixe pour l'URL de redirection, souvent réglée sur `localhost` par défaut.

## Solution appliquée
Le service `GoogleDriveService` du backend a été rendu **intelligent** :
1. Il vérifie s'il s'exécute dans un environnement de production (Vercel).
2. Si oui, il force l'utilisation de `https://arlong-gamma.vercel.app/api/auth/google/callback` comme URL de redirection vers Google.
3. Si non (développement local), il conserve `localhost`.

## Impact
L'APK (qui communique avec Vercel) reçoit maintenant une URL d'authentification valide que Google peut traiter, permettant un retour réussi vers l'application après le consentement.
