# Système de Mise à Jour (Mboa Drive)

Mboa Drive inclut un système de mise à jour automatique pour les versions Desktop.

## Fonctionnement
1. **Publication** : L'administrateur publie une nouvelle version via l'interface `/admin` sur la version Web.
2. **Détection** : L'application Desktop vérifie régulièrement la dernière version valide via l'API `/api/versions/latest`.
3. **Notification** : Si une nouvelle version est détectée (code de version supérieur), une bannière apparaît en bas de l'application.
4. **Téléchargement** : L'utilisateur peut cliquer sur "Télécharger" pour obtenir le nouvel installateur.

## Rôles Administrateurs
Seuls les emails suivants peuvent gérer les versions :
- ravel@mboa.com
- tchinda@mboa.com
- william@mboa.com
