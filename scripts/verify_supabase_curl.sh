#!/bin/bash
# ============================================================================
# SCRIPT DE VÉRIFICATION SUPABASE VIA API REST (cURL)
# ============================================================================

echo "=============================================="
echo "🔍 VÉRIFICATION SUPABASE - API REST (cURL)"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
SUPABASE_URL="${SUPABASE_URL:-https://xmmtanweqsxqlfomgaxp.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_ANON_KEY}}"

if [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY non définie${NC}"
    exit 1
fi

# Fonction helper pour les requêtes
query() {
    curl -s "${SUPABASE_URL}/rest/v1/$1" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "Content-Type: application/json" \
        ${@:2}
}

echo "URL: $SUPABASE_URL"
echo ""

# 1. Test de connexion
echo "1️⃣  TEST DE CONNEXION"
echo "--------------------"
response=$(query "User?select=id&limit=1")
if echo "$response" | grep -q "error"; then
    echo -e "${RED}❌ Erreur connexion:${NC}"
    echo "$response" | head -5
else
    echo -e "${GREEN}✅ Connexion OK${NC}"
fi
echo ""

# 2. Liste des tables (comptage)
echo "2️⃣  COMPTAGE PAR TABLE"
echo "----------------------"
tables=("User" "Espace" "Dossier" "Document" "Historique" "EspaceUser")
for table in "${tables[@]}"; do
    count=$(query "${table}?select=id" -I -X HEAD 2>/dev/null | grep -i "content-range" | cut -d'/' -f2 | tr -d '\r')
    if [ -n "$count" ]; then
        echo "   $table: $count enregistrements"
    else
        echo "   $table: ?"
    fi
done
echo ""

# 3. Utilisateurs récents
echo "3️⃣  UTILISATEURS RÉCENTS (5 derniers)"
echo "--------------------------------------"
users=$(query "User?select=id,name,email,is_admin,created_at&order=created_at.desc&limit=5")
echo "$users" | python3 -m json.tool 2>/dev/null || echo "$users"
echo ""

# 4. Espaces
echo "4️⃣  ESPACES"
echo "-----------"
espaces=$(query "Espace?select=id,name,createdById,created_at&limit=5")
echo "$espaces" | python3 -m json.tool 2>/dev/null || echo "$espaces"
echo ""

# 5. Dossiers
echo "5️⃣  DOSSIERS (10 premiers)"
echo "--------------------------"
dossiers=$(query "Dossier?select=id,name,espaceId,createdById&limit=10")
echo "$dossiers" | python3 -m json.tool 2>/dev/null || echo "$dossiers"
echo ""

# 6. Documents
echo "6️⃣  DOCUMENTS (5 premiers)"
echo "-------------------------"
docs=$(query "Document?select=id,name,type,size,dossierId&limit=5")
echo "$docs" | python3 -m json.tool 2>/dev/null || echo "$docs"
echo ""

# 7. Historique
echo "7️⃣  HISTORIQUE (5 derniers)"
echo "--------------------------"
histo=$(query "Historique?select=id,actionType,userId,docId,actionDate&order=actionDate.desc&limit=5")
echo "$histo" | python3 -m json.tool 2>/dev/null || echo "$histo"
echo ""

# 8. Test d'insertion
echo "8️⃣  TEST D'INSERTION"
echo "--------------------"
test_email="test_$(date +%s)@example.com"
response=$(curl -s "${SUPABASE_URL}/rest/v1/User" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -X POST \
    -d "{\"name\": \"Test Verification\", \"email\": \"$test_email\", \"password\": \"test_hash\"}")

if echo "$response" | grep -q "error"; then
    echo -e "${RED}❌ Échec insertion:${NC}"
    echo "$response" | head -3
else
    echo -e "${GREEN}✅ Insertion OK${NC}"
    # Récupérer l'ID pour suppression
    new_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
    if [ -n "$new_id" ]; then
        # Suppression
        del_response=$(curl -s "${SUPABASE_URL}/rest/v1/User?id=eq.${new_id}" \
            -H "apikey: ${SUPABASE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_KEY}" \
            -X DELETE)
        echo -e "${GREEN}✅ Nettoyage OK (ID: $new_id)${NC}"
    fi
fi
echo ""

# 9. Test de schéma
echo "9️⃣  VÉRIFICATION DES COLONNES"
echo "-----------------------------"
schema=$(query "User?select=*&limit=1")
echo "Colonnes User:"
echo "$schema" | python3 -c "import sys,json; data=json.load(sys.stdin); print('   ' + ', '.join(data[0].keys()) if data and len(data)>0 else '   Aucune donnée')" 2>/dev/null || echo "   Impossible de parser"
echo ""

echo "=============================================="
echo -e "${GREEN}✅ VÉRIFICATION TERMINÉE${NC}"
echo "=============================================="
