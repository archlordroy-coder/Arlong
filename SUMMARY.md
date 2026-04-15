# Résumé des modifications - Arlong / Mboa Drive v2.0

## 1. Système de Mise à Jour & Administration
- **API Backend** : Nouveaux endpoints sous `/api/versions` pour gérer les releases.
- **Interface Admin (Web & Desktop)** : Nouveau portail `/admin` pour les administrateurs (ravel@mboa.com, tchinda@mboa.com, william@mboa.com).
- **Auto-Update (Desktop)** : Vérification automatique au démarrage et bandeau de notification si une mise à jour est disponible.

## 2. WhatsApp Bot (Desktop)
- **Intégration** : Synchronisation via QR Code dans la page **Paramètres**.
- **Anti-Ban** : Système d'envoi "humain" avec des délais aléatoires de 2 à 5 secondes entre chaque message.
- **Fonctionnalité** : Prêt pour l'envoi de fichiers archivés.

## 3. Intelligence Artificielle (Gemma 4)
- **Assistant Chat** : Page dédiée pour discuter avec Arlong AI.
- **Vision** : Capacité d'OCR (extraction de texte) et de description d'images via l'API Google Gemini.

## 4. Infrastructure & Sécurité
- **Refactoring Electron** : Utilisation d'un pont (Preload) sécurisé.
- **Offline Cache** : Cache local SQLite pour la consultation hors-ligne.
- **Firebase Mirror** : Préparation pour le mirroring rapide des fichiers < 10MB.
- **Partage** : Système de partage de dossiers/espaces avec permissions granulaires.

## 🛠️ Actions requises (Supabase)
Exécutez le contenu du fichier **`modif.sql`** dans l'éditeur SQL de votre interface Supabase pour mettre à jour la base de données sans perdre vos données existantes.

## 🔑 Variables d'Environnement à ajouter
- `FIREBASE_SERVICE_ACCOUNT` : JSON du compte de service Firebase.
- `FIREBASE_BUCKET` : Nom du bucket storage.
- `GEMINI_API_KEY` : Clé API Google AI Studio.
- `GOOGLE_CLIENT_ID` / `SECRET` : Pour les fonctions Gmail.

---
*Mboa Drive Team - v2.0.0*
