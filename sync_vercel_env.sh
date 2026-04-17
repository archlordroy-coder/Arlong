#!/bin/bash
# =============================================================================
# Script de synchronisation des variables d'environnement vers Vercel
# Usage: VERCEL_TOKEN=votre_token bash sync_vercel_env.sh
# Obtenir un token: https://vercel.com/account/tokens
# =============================================================================

PROJECT_ID="prj_UYG7ES5uvCidngA69kzytE5822K4"
TEAM_ID="team_tgFmSXLV17fYHSHuPc3M6nqj"
TOKEN="${VERCEL_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "❌ VERCEL_TOKEN manquant."
  echo "   1. Allez sur https://vercel.com/account/tokens"
  echo "   2. Créez un token et copiez-le"
  echo "   3. Lancez: VERCEL_TOKEN=votre_token bash sync_vercel_env.sh"
  exit 1
fi

API="https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}"

echo "🔍 Récupération des variables existantes sur Vercel..."
EXISTING=$(curl -s "$API" -H "Authorization: Bearer $TOKEN")
IDS=$(echo "$EXISTING" | python3 -c "import sys,json; [print(e['id']) for e in json.load(sys.stdin).get('envs',[])]" 2>/dev/null)

echo "🗑️  Suppression des variables existantes..."
COUNT=0
for ID in $IDS; do
  curl -s -X DELETE "https://api.vercel.com/v10/projects/${PROJECT_ID}/env/${ID}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  COUNT=$((COUNT + 1))
done
echo "  $COUNT variable(s) supprimée(s)"

echo ""
echo "➕ Ajout des nouvelles variables..."

# Lit le .env.local du backend et l'envoie à Vercel
# Variables avec valeurs adaptées pour la production
declare -A PROD_OVERRIDES=(
  ["GOOGLE_REDIRECT_URI"]="https://arlong-gamma.vercel.app/api/auth/google/callback"
  ["FRONTEND_URL"]="https://arlong-gamma.vercel.app"
  ["VITE_API_URL"]="https://arlong-gamma.vercel.app/api"
)

# Parse le .env.local
ENV_FILE="$(dirname "$0")/backend/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="$(dirname "$0")/backend/.env"
fi

echo "  Source: $ENV_FILE"

# Fonction d'envoi
send_env() {
  local KEY="$1"
  local VALUE="$2"
  
  # Skip les vides et les commentaires
  [ -z "$KEY" ] && return
  [[ "$KEY" == \#* ]] && return
  [ -z "$VALUE" ] && return

  # Override pour la prod
  if [ -n "${PROD_OVERRIDES[$KEY]+x}" ]; then
    VALUE="${PROD_OVERRIDES[$KEY]}"
  fi

  PAYLOAD=$(python3 -c "
import json, sys
key = sys.argv[1]
val = sys.argv[2]
print(json.dumps({'key': key, 'value': val, 'type': 'encrypted', 'target': ['production', 'preview', 'development']}))
" "$KEY" "$VALUE")

  RES=$(curl -s -X POST "$API" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  STATUS=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if 'id' in d else '❌ ' + str(d.get('error',{}).get('message','?')))" 2>/dev/null)
  echo "  $KEY: $STATUS"
}

# Ajouter les vars du .env.local
while IFS= read -r line || [ -n "$line" ]; do
  # Ignorer commentaires et lignes vides
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  
  KEY=$(echo "$line" | cut -d'=' -f1 | tr -d ' ')
  VALUE=$(echo "$line" | cut -d'=' -f2- | sed 's/^["'"'"']//;s/["'"'"']$//')
  
  send_env "$KEY" "$VALUE"
done < "$ENV_FILE"

# Ajouter les variables VITE_ frontend additionnelles
send_env "VITE_API_URL" "https://arlong-gamma.vercel.app/api"
send_env "VITE_SUPABASE_URL" "$(grep SUPABASE_URL "$ENV_FILE" | cut -d'=' -f2- | tr -d '"'"' "')"
send_env "VITE_SUPABASE_ANON_KEY" "$(grep SUPABASE_ANON_KEY "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"'"' "')"
send_env "VITE_GOOGLE_CLIENT_ID" "$(grep GOOGLE_CLIENT_ID "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"'"' "')"

echo ""
echo "✅ Synchronisation terminée !"
echo "👉 Vérifiez: https://vercel.com/archlordroy-coder/arlong/settings/environment-variables"
echo ""
echo "🚀 Pour redéployer avec les nouvelles variables:"
echo "   Allez sur https://vercel.com/archlordroy-coder/arlong/deployments"
echo "   Cliquez sur le dernier déploiement → '...' → 'Redeploy'"
