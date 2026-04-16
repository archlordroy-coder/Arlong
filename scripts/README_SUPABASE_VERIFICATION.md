# 📋 Guide de Vérification Supabase - MboaDrive

## 🔧 Prérequis

Avant de lancer les vérifications, assurez-vous d'avoir:

```bash
# Variables d'environnement requises
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_ANON_KEY="your-anon-key"
```

---

## 🚀 Méthodes de Vérification

### 1️⃣ Vérification via API REST (cURL) - RECOMMANDÉ

```bash
# Rendre le script exécutable et l'exécuter
cd /persistent/home/ravel/Arlong/scripts
chmod +x verify_supabase_curl.sh
./verify_supabase_curl.sh
```

**Ce script vérifie:**
- ✅ Connexion à Supabase
- ✅ Comptage des tables (User, Espace, Dossier, Document, Historique, EspaceUser)
- ✅ Liste des utilisateurs récents
- ✅ Liste des espaces
- ✅ Liste des dossiers
- ✅ Liste des documents
- ✅ Historique récent
- ✅ Test d'insertion/suppression

---

### 2️⃣ Vérification via Supabase CLI

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter au projet
supabase login
supabase link --project-ref xmmtanweqsxqlfomgaxp

# Lancer la vérification
cd /persistent/home/ravel/Arlong/scripts
chmod +x verify_supabase.sh
./verify_supabase.sh
```

**Commandes CLI utiles:**

```bash
# Voir le statut du projet
supabase status

# Dumper le schéma
supabase db dump --schema-only > schema_backup.sql

# Dumper les données
supabase db dump --data-only > data_backup.sql

# Exécuter une requête SQL
supabase db query "SELECT * FROM \"User\" LIMIT 5;"

# Lister les tables
supabase db query "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

---

### 3️⃣ Vérification via JavaScript/Node.js

```bash
# Installer les dépendances si nécessaire
cd /persistent/home/ravel/Arlong/backend
npm install @supabase/supabase-js

# Exécuter le script
cd /persistent/home/ravel/Arlong/scripts
node verify_supabase.js
```

---

### 4️⃣ Vérification via SQL Direct

Accédez à l'**éditeur SQL** dans le dashboard Supabase: https://supabase.com/dashboard/project/xmmtanweqsxqlfomgaxp/sql

Puis exécutez les commandes du fichier `verify_supabase.sql`:

```sql
-- Vérifier les tables existantes
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- Vérifier la structure de la table User
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User';

-- Compter les enregistrements
SELECT 'User' as table_name, COUNT(*) FROM "User"
UNION ALL
SELECT 'Espace', COUNT(*) FROM "Espace"
UNION ALL
SELECT 'Dossier', COUNT(*) FROM "Dossier";

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

# 5️⃣ Vérification via cURL Manuel

```bash
# Définir les variables
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-service-role-key"


# 1. Test de connexion - Liste des utilisateurs
curl -s "${SUPABASE_URL}/rest/v1/User?select=id,name,email&limit=5" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}"

# 2. Compter les utilisateurs
curl -s "${SUPABASE_URL}/rest/v1/User?select=id" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -I -X HEAD | grep "content-range"

# 3. Vérifier les espaces
curl -s "${SUPABASE_URL}/rest/v1/Espace?select=*&limit=5" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}"

# 4. Vérifier les dossiers
curl -s "${SUPABASE_URL}/rest/v1/Dossier?select=*&limit=10" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}"

# 5. Test d'insertion
curl -s "${SUPABASE_URL}/rest/v1/User" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -X POST \
    -d '{"name": "Test", "email": "test@example.com", "password": "hash"}'

# 6. Supprimer le test (remplacez ID par l'ID retourné)
curl -s "${SUPABASE_URL}/rest/v1/User?id=eq.ID" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -X DELETE
```

---

## 📊 Tables à Vérifier

| Table | Description | Vérification Importante |
|-------|-------------|-------------------------|
| **User** | Utilisateurs | `created_at`, `is_admin`, `password` (hash bcrypt) |
| **Espace** | Espaces de stockage | `createdById` (FK vers User) |
| **EspaceUser** | Liaison user-espace | `userId`, `espaceId`, `role` |
| **Dossier** | Dossiers/folders | `espaceId`, `createdById`, `isPublic` |
| **Document** | Documents | `dossierId`, `espaceId`, `url`, `type` |
| **Historique** | Logs d'activité | `userId`, `docId`, `actionType`, `actionDate` |

---

## ⚠️ Problèmes Courants

### ❌ "column User.created_at does not exist"
```sql
-- Solution: Ajouter la colonne
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
```

### ❌ "Invalid API key"
- Vérifiez que vous utilisez la **Service Role Key** (pas l'Anon Key) pour les opérations admin
- Vérifiez l'URL: doit être `https://xmmtanweqsxqlfomgaxp.supabase.co`

### ❌ "Cannot find native binding" (frontend)
```bash
cd frontend/web
rm -rf node_modules package-lock.json
npm install
```

---

# 🎯 Test Rapide (30 secondes)

```bash
cd /persistent/home/ravel/Arlong

# Backend
curl -s http://localhost:5000/api/env-check 2>/dev/null && echo "✅ Backend OK" || echo "❌ Backend OFF"

# Supabase Direct
curl -s "https://your-project.supabase.co/rest/v1/User?select=count" \
    -H "apikey: your-service-role-key" \
    -H "Authorization: Bearer your-service-role-key" \
    -I | grep -q "200 OK" && echo "✅ Supabase OK" || echo "❌ Supabase Erreur"
```


---

## 📁 Fichiers de Vérification

| Fichier | Description |
|---------|-------------|
| `verify_supabase_curl.sh` | Vérification via API REST (RECOMMANDÉ) |
| `verify_supabase.sh` | Vérification via Supabase CLI |
| `verify_supabase.js` | Vérification via JavaScript |
| `verify_supabase.sql` | Requêtes SQL pour éditeur Supabase |

---

## 🆘 Support

En cas de problème:
1. Vérifiez les logs: `cd backend && npm run dev:backend`
2. Testez Supabase direct: Dashboard → https://supabase.com/dashboard/project/xmmtanweqsxqlfomgaxp
3. Vérifiez les variables d'environnement dans `.env.local`
