# Guides Clés d'API & Approbation Sécurité Google

Pour que vos mécanismes Backend (notamment l'interface avec Google Drive ou l'OAuth authentification) ne soient pas blacklistés/marqués comme spams par l'écosystème Google, il faut impérativement établir une confiance via la Console Cloud Google. 

Le plus grand problème à éviter : une immense page de blocage rouge *"Cette application n'est pas vérifiée"* ou une erreur de quota bloquant la production et l'accès de vos utilisateurs !

## Étape 1 : Activation Google Cloud Console

1. Connectez un compte vérifié sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un projet qui sera présenté explicitement aux utilisateurs (ex: `ARLONG` / `Arlong`).
3. Cherchez selon les fonctionnalités utilisées (ex: `Google Drive API`) et cliquez sur `Activer l'API`. 

## Étape 2 : Configuration "Consent Screen" (Écran de consentement)

> [!WARNING]
> Si votre environnement OAuth demeure indéfiniment en statut "Test", l'intégration bloquera l’accès au bout de 7 jours (expiration immédiate des Tokens) !

- **Type de Déploiement** : Si vous distribuez l'App via web public ou en téléchargeant un APK sur Android, réglez ce mode en "Externe" (Production). (Le terme "Interne" limite strictos aux collaborateurs de votre plan d'entreprise, sinon ça crashera).
- **Identité de l'Application** : Saisissez impérativement vos liens légaux publiquement enregistrés (Terms of Services, Privacy Policy...)
- **Périmètre des Scopes (le Danger Sensible)** : L'accès aux fichiers du Drive tiers comme `/auth/drive.file` est dit restreint. Si c'est en production, vous devez passer par le process de **Vérification d'Appli de Google**. (Envoi formel d’une vidéo expliquant l’action exacte de l'appli en situation réelle afin de prouver que vos scripts ne sont pas un Ransomware).

## Étape 3 : Création des Identités Applicatives (Client IDs)

Chaque plateforme requiert un certificat / Client ID OAuth très singulier pour ne pas être rejeté. C'est le pilier de votre succès multi-support.

- **Frontend Cloud (Vercel ou Supabase)** :
  - Choisissez le format de création en tant qu'`Application Web`.
  - Intégrez **Origines Autorisées** (`http://localhost:5173` et pour Vercel `https://arlong.vercel.app`).
  - Autorisez les Redirections valides pour Supabase.
- **Frontend Appli Android (`.apk`)** :
  - Optez explicitement à la création d'un identifiant `Application Android` !
  - Renseignez le nom exact du package configuré dans capacitor (`com.arlong.app` par l’architecture `capacitor.config.ts`).
  - Extrayez **l'Empreinte SHA-1**. Générez-la à partir du fichier `.keystore` de production : (`keytool -list -v -keystore mon-keystore-production.jks`), et renseignez-le chez Google Cloud !
- **Frontend EXE Bureau (Windows)** :
  - Les redirections OAuth sur Desktop via Electron posent des verrous DNS de la part de Google. Il est souvent conseillé d'utiliser le pattern de sécurité Supabase Auth Link Interstitial ou de simuler une App de Serveur à Client avec port variable local.

## Sécurisation Interne Node.js (Protection Git)

Les variables `GOOGLE_CLIENT_ID`, et surlout `GOOGLE_CLIENT_SECRET` ne doivent **absolument jamais** passer par les pipelines Github Action dans un dépôt public ou être compilés dans les `.apk` ou les fichiers Web de Vite. Enregistrez la seule confiance dans de purs `process.env(...)` qui demeurent injectés manuellement dans le serveur physique Backend.
