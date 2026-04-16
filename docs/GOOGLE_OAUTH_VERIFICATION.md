# 🚀 Guide : Soumettre Mboa Drive à la Vérification Google OAuth

## Contexte

Actuellement, votre application est en mode **"Test"** avec une limite de 100 utilisateurs (espace réservé à votre liste d'utilisateurs de test).  
Pour que **n'importe qui** puisse lier son compte Google Drive, vous devez faire **vérifier votre application** par Google.

> [!IMPORTANT]
> La vérification Google OAuth est **gratuite** mais peut prendre entre **4 et 6 semaines**.  
> Pendant cette attente, seuls vos 100 utilisateurs de test peuvent utiliser la fonctionnalité Drive.

---

## Pré-requis avant de soumettre

Avant de commencer le processus, vous devez avoir :

- [x] Un **domaine vérifié** (ex: `arlong-gamma.vercel.app` ou votre propre domaine)
- [x] Une **page de politique de confidentialité** accessible publiquement (`/privacy`)
- [x] Une **page de conditions d'utilisation** accessible publiquement (`/terms`)
- [x] Un **logo** de l'application (120×120 px minimum, format PNG)
- [x] Une **adresse email de contact** valide

---

## Étape 1 : Vérifier votre domaine

1. Allez sur [Google Search Console](https://search.google.com/search-console)
2. Cliquez sur **"Ajouter une propriété"**
3. Entrez votre URL : `https://arlong-gamma.vercel.app`
4. Choisissez la méthode **"Balise HTML"** et copiez la balise fournie
5. Collez cette balise dans votre fichier `frontend/web/public/` (le fichier `google-site-verification.html` que vous avez déjà)
6. Déployez et revenez cliquer **"Vérifier"** dans la console

---

## Étape 2 : Configurer l'écran de consentement OAuth

1. Rendez-vous sur [console.cloud.google.com](https://console.cloud.google.com)
2. Sélectionnez votre projet **Mboa Drive**
3. Dans le menu gauche : **APIs & Services → OAuth Consent Screen**

### Remplissez chaque champ :

| Champ | Valeur à mettre |
|---|---|
| **App name** | Mboa Drive |
| **User support email** | Votre email |
| **App logo** | Votre logo PNG (120×120 min) |
| **App homepage** | `https://arlong-gamma.vercel.app` |
| **Privacy policy** | `https://arlong-gamma.vercel.app/privacy` |
| **Terms of service** | `https://arlong-gamma.vercel.app/terms` |
| **Authorized domains** | `arlong-gamma.vercel.app` (ou votre domaine) |
| **Developer email** | Votre email |

---

## Étape 3 : Vérifier les Scopes (Niveaux d'accès)

Dans la section **"Scopes"**, assurez-vous que seul ce scope est demandé :

```
https://www.googleapis.com/auth/drive.file
```

> [!TIP]
> `drive.file` est un scope **"Sensible"** qui n'accède qu'aux fichiers créés par votre app.  
> C'est bien moins restrictif que `drive` (accès total). Google le vérifie mais l'approuve plus facilement.

---

## Étape 4 : Soumettre pour vérification

1. Dans votre écran de consentement OAuth, cliquez sur **"Publier l'application"** (si en mode Test)
2. Puis cliquez sur **"Préparer la vérification"**
3. Google vous posera des questions sur votre utilisation du scope. Répondez :

> *"L'application Mboa Drive permet aux utilisateurs de sauvegarder leurs archives chiffrées directement dans leur propre espace Google Drive personnel. Seuls les fichiers créés par l'application sont accédés."*

4. **Fournissez une vidéo de démonstration** (obligatoire) :
   - Durée : 1 à 5 minutes
   - Montrez clairement comment l'utilisateur autorise l'accès et comment l'application utilise Drive
   - Hébergez-la sur YouTube (peut être en non-listé)

---

## Étape 5 : En attendant la vérification

Pendant les 4 à 6 semaines de traitement, vous avez deux options :

### Option A — Utiliser la liste d'utilisateurs de test (max 100)
Ajoutez les adresses email de vos utilisateurs dans :
**OAuth Consent Screen → Test users → Add users**

### Option B — Afficher l'avertissement "App non vérifiée"
Vos utilisateurs verront un écran d'avertissement orange de Google. Ils peuvent cliquer sur **"Advanced" → "Go to arlong (unsafe)"** pour continuer. Utilisable pour un usage interne ou académique.

---

## Étape 6 : Après la vérification

Une fois Google ayant approuvé votre application :
- La limite de 100 utilisateurs disparaît
- L'écran d'avertissement orange disparaît
- N'importe quel utilisateur Google peut lier son compte sans restriction

---

## 🎓 Cas spécial : Projet Académique

Si votre application est destinée à un **projet scolaire ou académique**, deux alternatives existent sans passer par la vérification Google :

1. **Maintenir une liste de 100 testeurs** : Suffisant pour une démonstration académique
2. **Utiliser votre compte Google** lors des démonstrations plutôt que de demander aux correcteurs de lier leur propre compte

> [!NOTE]
> Pour un rendu scolaire, la vérification Google n'est généralement **pas nécessaire**.  
> Il suffit d'ajouter l'email du correcteur dans la liste des utilisateurs de test.

---

## Checklist finale avant soumission

- [ ] Domaine vérifié dans Google Search Console
- [ ] Page `/privacy` accessible publiquement
- [ ] Page `/terms` accessible publiquement  
- [ ] Logo de l'app prêt (PNG, min 120×120px)
- [ ] Vidéo de démonstration enregistrée et hébergée sur YouTube
- [ ] Seul le scope `drive.file` est demandé
- [ ] Email de contact valide renseigné
- [ ] Description de l'utilisation des données rédigée
