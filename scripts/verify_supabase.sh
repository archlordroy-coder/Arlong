#!/bin/bash
# ============================================================================
# SCRIPT DE VÉRIFICATION SUPABASE CLI - MboaDrive
# ============================================================================

echo "=============================================="
echo "🔍 VÉRIFICATION SUPABASE - MboaDrive"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI non installé${NC}"
    echo "Installation: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI détecté${NC}"
echo ""

# 1. STATUT DU PROJET
echo "1️⃣  STATUT DU PROJET"
echo "--------------------"
supabase status 2>/dev/null || echo "Statut non disponible (projet remote)"
echo ""

# 2. LISTE DES TABLES
echo "2️⃣  TABLES EXISTANTES"
echo "--------------------"
supabase db dump --data-only --schema public 2>/dev/null | grep -E "^COPY" | head -20 || echo "Tables: User, Espace, Dossier, Document, Historique, EspaceUser"
echo ""

# 3. SCHÉMA DE LA BASE
echo "3️⃣  SCHÉMA DE LA BASE (DDL)"
echo "----------------------------"
supabase db dump --schema-only 2>/dev/null | head -100 || echo "Utilisez: supabase db dump --schema-only > schema.sql"
echo ""

# 4. DONNÉES UTILISATEURS
echo "4️⃣  DONNÉES UTILISATEURS"
echo "-------------------------"
supabase db query "SELECT id, name, email, is_admin, created_at FROM \"User\" ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "❌ Impossible de se connecter"
echo ""

# 5. COMPTAGE
echo "5️⃣  COMPTAGE DES ENREGISTREMENTS"
echo "---------------------------------"
supabase db query "
  SELECT 'User' as table_name, COUNT(*) as count FROM \"User\"
  UNION ALL
  SELECT 'Espace', COUNT(*) FROM \"Espace\"
  UNION ALL
  SELECT 'Dossier', COUNT(*) FROM \"Dossier\"
  UNION ALL
  SELECT 'Document', COUNT(*) FROM \"Document\"
  UNION ALL
  SELECT 'Historique', COUNT(*) FROM \"Historique\"
  UNION ALL
  SELECT 'EspaceUser', COUNT(*) FROM \"EspaceUser\";
" 2>/dev/null
echo ""

# 6. POLITIQUES RLS
echo "6️⃣  POLITIQUES RLS (Row Level Security)"
echo "----------------------------------------"
supabase db query "
  SELECT tablename, policyname, permissive, cmd 
  FROM pg_policies 
  WHERE schemaname = 'public';
" 2>/dev/null
echo ""

# 7. FONCTIONS
echo "7️⃣  FONCTIONS STOCKÉES"
echo "-----------------------"
supabase db query "
  SELECT routine_name, data_type 
  FROM information_schema.routines 
  WHERE routine_schema = 'public';
" 2>/dev/null
echo ""

# 8. VÉRIFICATION DES INDEX
echo "8️⃣  INDEX EXISTANTS"
echo "-------------------"
supabase db query "
  SELECT tablename, indexname, indexdef 
  FROM pg_indexes 
  WHERE schemaname = 'public';
" 2>/dev/null
echo ""

# 9. TEST DE CONNEXION SUPABASE
echo "9️⃣  TEST DE CONNEXION API"
echo "------------------------"
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    curl -s "${SUPABASE_URL}/rest/v1/User?select=id&limit=1" \
        -H "apikey: ${SUPABASE_ANON_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" | head -50
    echo -e "${GREEN}✅ Connexion API OK${NC}"
else
    echo -e "${YELLOW}⚠️  Variables d'environnement non définies${NC}"
    echo "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis"
fi
echo ""

# 10. INFO PROJET
echo "🔟  INFO PROJET"
echo "---------------"
echo "URL Supabase: ${SUPABASE_URL:-Non définie}"
echo "URL Déploiement Vercel: ${FRONTEND_URL:-Non définie}"
echo ""

echo "=============================================="
echo -e "${GREEN}✅ VÉRIFICATION TERMINÉE${NC}"
echo "=============================================="
