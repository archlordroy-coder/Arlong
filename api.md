# 🛠️ Configuration Google Cloud Console - Mboa Drive v2.0

Pour que toutes les fonctionnalités de Mboa Drive (v2.0) soient opérationnelles, vous devez activer les APIs suivantes dans votre projet Google Cloud Console.

## 🔑 1. APIs à Activer
Rendez-vous dans [API Library](https://console.cloud.google.com/apis/library) et activez :

- **Google Drive API** : Nécessaire pour le stockage principal des archives.
- **Gmail API** : Nécessaire pour l'envoi d'archives par email directement depuis l'app.
- **Google Docs API** : Pour la création et l'exportation de documents liés aux espaces.
- **Google Sheets API** : Pour la gestion des tableaux de données.
- **Google Forms API** : Pour la collecte de données via formulaires.
- **Google Picker API** (Optionnel) : Pour une sélection facilitée de fichiers Drive existants.

## 🔐 2. Scopes OAuth Requis
Dans la section "OAuth consent screen", assurez-vous d'ajouter les scopes suivants :

| API | Scope | Description |
|---|---|---|
| Drive | `.../auth/drive.file` | Voir, éditer, créer et supprimer uniquement les fichiers ouverts ou créés avec l'app. |
| Drive | `.../auth/drive.metadata.readonly` | Voir les métadonnées pour l'arborescence. |
| Gmail | `.../auth/gmail.send` | Envoyer des emails au nom de l'utilisateur (pour les archives). |
| Docs | `.../auth/documents` | Créer et éditer des documents. |
| Sheets | `.../auth/spreadsheets` | Créer et éditer des feuilles de calcul. |
| Forms | `.../auth/forms.body` | Créer et éditer des formulaires. |

## 🚀 3. Configuration de l'identifiant OAuth 2.0
Dans "Credentials" > "Create Credentials" > "OAuth client ID" :

### Pour la version Web :
- **Authorized JavaScript origins** : `https://arlong-gamma.vercel.app`
- **Authorized redirect URIs** : `https://arlong-gamma.vercel.app/api/auth/google/callback`

### Pour la version Desktop (Electron) :
- **Application type** : `Desktop app`
- **Note** : Le callback est géré via le protocole personnalisé `arlong-desktop://oauth/callback`.

## 🤖 4. Google AI (Gemma 4 / Gemini)
- Obtenez une clé API sur [Google AI Studio](https://aistudio.google.com/).
- Ajoutez cette clé à la variable d'environnement `GEMINI_API_KEY`.

---
*Mboa Drive Team - Configuration v2.0*
