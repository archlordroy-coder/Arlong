# Proposition de champs d'application (Scopes) Google Cloud Non-Restreints

Pour éviter les audits de sécurité complexes et coûteux (Restricted Scopes), voici une proposition de scopes classés comme "Sensibles" (mais pas "Restreints") ou "Non-sensibles" qui permettent de maintenir les fonctionnalités de Mboa Drive.

## 1. Google Drive (Remplacement de /auth/drive)
*   **Scope proposé :** `https://www.googleapis.com/auth/drive.file`
*   **Description :** Permet d'afficher, modifier et supprimer uniquement les fichiers et dossiers créés par l'application ou ouverts avec elle.
*   **Avantage :** C'est un scope **Sensible** (et non Restreint). Il permet la sauvegarde et la gestion des documents sans nécessiter l'audit de sécurité complet requis par le scope `drive` global.

## 2. Google Docs & Sheets
*   **Scope proposé :** Aucun scope spécifique supplémentaire si `drive.file` est utilisé.
*   **Description :** `drive.file` donne accès aux documents Docs/Sheets que l'utilisateur crée via l'application.
*   **Alternative :** Éviter `/auth/spreadsheets` et `/auth/docs` (Restreints) pour l'instant si vous ne manipulez que des fichiers exportés (PDF, Word, Excel).

## 3. Gmail (Remplacement de /auth/gmail.send)
*   **Scope proposé :** `https://www.googleapis.com/auth/gmail.send`
*   **Description :** Envoyer des e-mails au nom de l'utilisateur.
*   **Note :** Bien que classé comme "Sensible", il est beaucoup moins surveillé que `gmail.readonly` ou `gmail.modify`.
*   **Alternative "Plus légère" :** Utiliser une API tierce (comme SendGrid ou Resend) pour les envois, mais cela perdrait l'intégration "Gmail natif".

## 4. Google Forms
*   **Scope proposé :** `https://www.googleapis.com/auth/drive.file` (encore lui)
*   **Description :** Si les formulaires sont créés par l'application, `drive.file` suffit souvent.

## Résumé pour la Console Google Cloud :
1.  `openid` (Non-sensible)
2.  `https://www.googleapis.com/auth/userinfo.email` (Non-sensible)
3.  `https://www.googleapis.com/auth/userinfo.profile` (Non-sensible)
4.  `https://www.googleapis.com/auth/drive.file` (Sensible)
5.  `https://www.googleapis.com/auth/gmail.send` (Sensible)

**Action requise :** Supprimer les scopes finissant par `/auth/drive`, `/auth/spreadsheets`, `/auth/docs` et `/auth/forms.body` pour rester dans la catégorie "Sensible" uniquement.
