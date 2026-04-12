# 🔑 Rendre la Liaison Google Drive Accessible à Tous

## Le problème actuel

Votre app Google OAuth est en **mode "Test"**. Cela signifie que seuls les comptes ajoutés manuellement dans la Google Cloud Console peuvent lier leur Drive.

Pour tout autre utilisateur, la liaison échoue avec l'erreur :  
> *"Ce compte n'est pas autorisé à accéder à cette application"*

---

## ✅ Solution Rapide (sans délai) — Ajouter des utilisateurs manuellement

Cette méthode est **immédiate**, sans attente, sans validation Google.

1. Rendez-vous sur [console.cloud.google.com](https://console.cloud.google.com)
2. Sélectionnez le projet **Mboa Drive** (ou le nom actuel dans GCP)
3. Dans le menu gauche : **APIs & Services → OAuth consent screen**
4. Faites défiler jusqu'à la section **"Test users"**
5. Cliquez sur **"+ Add users"**
6. Renseignez l'adresse Gmail de la personne à autoriser
7. Cliquez **Save**

L'utilisateur peut maintenant lier son Drive **immédiatement** sans aucune modification du code.

> [!NOTE]
> Limite : **100 adresses maximum** en mode Test.  
> Si vous dépassez cette limite, il faut passer par la vérification Google (voir section ci-dessous).

---

## 🚀 Solution Permanente — Soumettre l'app à la vérification Google

Pour lever la limite des 100 utilisateurs et permettre à **n'importe qui** de lier son Drive sans être ajouté manuellement.

### Pré-requis à remplir avant de soumettre

| Requis | Statut | Action |
|---|---|---|
| Page de politique de confidentialité | ✅ Disponible sur `/privacy` | Rien à faire |
| Page de conditions d'utilisation | ✅ Disponible sur `/terms` | Rien à faire |
| Domaine vérifié dans Google Search Console | ❓ À vérifier | Voir Étape 1 |
| Logo de l'app (PNG, min 120×120px) | ❓ À préparer | Exporter le logo |
| Vidéo de démonstration (YouTube) | ❌ Manquant | Voir Étape 2 |

### Étape 1 : Vérifier le domaine dans Google Search Console

1. Allez sur [search.google.com/search-console](https://search.google.com/search-console)
2. Ajoutez `https://arlong-gamma.vercel.app` comme propriété
3. Choisissez la vérification **"Balise HTML"** et copiez la balise fournie
4. Placez la balise dans votre `index.html` (ou via les métadonnées Vercel)
5. Cliquez **Vérifier** dans la console

### Étape 2 : Enregistrer une vidéo de démonstration

La vidéo est **obligatoire** pour la soumission Google. Elle doit :
- Durer **1 à 5 minutes**
- Montrer comment l'utilisateur accorde l'accès Google Drive à Mboa Drive
- Montrer comment l'application utilise l'accès (upload/lecture de fichiers)
- Être hébergée sur **YouTube** (mode non-listé possible)

### Étape 3 : Publier l'application

1. Dans **OAuth consent screen**, cliquez **"Publier l'application"**
2. Cliquez **"Préparer la vérification"**
3. Décrivez l'utilisation du scope `drive.file` :

> *"Mboa Drive permet aux utilisateurs de stocker leurs archives chiffrées dans leur propre espace Google Drive. Seuls les fichiers créés par l'application sont accessibles, via le scope drive.file. Les données ne sont jamais partagées avec des tiers."*

4. Soumettez avec la vidéo YouTube
5. Attendez la réponse Google (**4 à 6 semaines**)

---

## 💡 Conseils pratiques pendant la période d'attente

- **Projet académique** : Ajoutez l'email du correcteur en utilisateur de test. C'est suffisant pour une soutenance.
- **Démo publique** : Prévoyez un compte Google de démonstration pré-configuré pour que le public puisse voir la fonctionnalité.
- **Production** : La vérification est incontournable. Planifiez-la 6 semaines avant le lancement public.

---

## 📋 Checklist de soumission

- [ ] Domaine vérifié dans Google Search Console  
- [ ] Logo PNG minimum 120×120px préparé  
- [ ] Vidéo de démonstration enregistrée et uploadée sur YouTube  
- [ ] Description du scope rédigée  
- [ ] Pages `/privacy` et `/terms` accessibles publiquement  
- [ ] Formulaire de soumission rempli dans la Google Cloud Console
