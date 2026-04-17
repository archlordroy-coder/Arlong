#!/bin/bash
# =============================================================================
# Script de synchronisation des variables d'environnement vers Vercel
# Usage: VERCEL_TOKEN=votre_token bash sync_vercel_env.sh
# =============================================================================

PROJECT_ID="prj_UYG7ES5uvCidngA69kzytE5822K4"
TEAM_ID="team_tgFmSXLV17fYHSHuPc3M6nqj"
TOKEN="${VERCEL_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "VERCEL_TOKEN manquant. Usage: VERCEL_TOKEN=xxx bash sync_vercel_env.sh"
  exit 1
fi

API_BASE="https://api.vercel.com"
API_ENV="${API_BASE}/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}"

echo "Recuperation des variables existantes sur Vercel..."
EXISTING=$(curl -s "$API_ENV" -H "Authorization: Bearer $TOKEN")
IDS=$(python3 -c "
import sys, json
data = json.loads('''$EXISTING'''.replace(\"'\", \"'\"))
" 2>/dev/null || echo "$EXISTING" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data.get('envs', []):
    print(e['id'])
")

# Récupérer IDs via grep plus simple
IDS=$(echo "$EXISTING" | python3 -c "import sys,json; [print(e['id']) for e in json.load(sys.stdin).get('envs',[])]")

echo "Suppression des variables existantes..."
COUNT=0
for ID in $IDS; do
  curl -s -X DELETE "${API_BASE}/v10/projects/${PROJECT_ID}/env/${ID}?teamId=${TEAM_ID}" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  COUNT=$((COUNT + 1))
done
echo "  $COUNT variable(s) supprimee(s)"

echo ""
echo "Ajout des nouvelles variables de production..."

# Variables de production (écrasent les valeurs locales)
declare -A PROD_VALS
PROD_VALS["GOOGLE_REDIRECT_URI"]="https://arlong-gamma.vercel.app/api/auth/google/callback"
PROD_VALS["FRONTEND_URL"]="https://arlong-gamma.vercel.app"

# Fonction pour envoyer une variable à Vercel
create_env() {
  local KEY="$1"
  local VALUE="$2"

  # Récupérer la valeur de prod si override existe
  if [ -n "${PROD_VALS[$KEY]+_}" ]; then
    VALUE="${PROD_VALS[$KEY]}"
  fi

  # Ignorer les variables vides
  [ -z "$VALUE" ] && echo "  $KEY: ⏭ (vide, ignoré)" && return

  # Envoyer via python3 pour gérer l'échappement proprement
  RES=$(python3 - <<PYEOF
import json, urllib.request, urllib.error

url = "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}"
token = "${TOKEN}"
payload = json.dumps({
    "key": "${KEY}",
    "value": ${VALUE@Q},
    "type": "encrypted",
    "target": ["production", "preview", "development"]
}).encode()

req = urllib.request.Request(url, data=payload, method="POST")
req.add_header("Authorization", f"Bearer {token}")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        print("OK:" + data.get("id", "?"))
except urllib.error.HTTPError as e:
    body = json.loads(e.read())
    print("ERR:" + body.get("error", {}).get("message", str(e)))
PYEOF
)

  if [[ "$RES" == OK:* ]]; then
    echo "  $KEY: OK"
  else
    echo "  $KEY: ERREUR - $RES"
  fi
}

# Lire le fichier .env.local
ENV_FILE="$(dirname "$0")/backend/.env.local"
[ ! -f "$ENV_FILE" ] && ENV_FILE="$(dirname "$0")/backend/.env"
echo "  Source: $ENV_FILE"

# Variables à ignorer (ne pas envoyer sur Vercel)
SKIP_VARS="FIREBASE_SERVICE_ACCOUNT FIREBASE_BUCKET UPDATE_SERVER_URL GOOGLE_REFRESH_TOKEN DATABASE_URL"

while IFS='=' read -r KEY VAL_RAW || [ -n "$KEY" ]; do
  # Ignorer commentaires et lignes vides
  [[ "$KEY" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${KEY// }" ]] && continue

  KEY="${KEY//[[:space:]]/}"
  # Supprimer guillemets autour de la valeur
  VAL="${VAL_RAW#\"}"
  VAL="${VAL%\"}"
  VAL="${VAL#\'}"
  VAL="${VAL%\'}"

  # Ignorer certaines variables
  [[ " $SKIP_VARS " == *" $KEY "* ]] && continue
  # Ne pas envoyer VERCEL_TOKEN lui-même
  [ "$KEY" = "VERCEL_TOKEN" ] && continue

  create_env "$KEY" "$VAL"
done < "$ENV_FILE"

# Ajouter les variables VITE_ pour le frontend
SUPABASE_URL=$(grep "^SUPABASE_URL=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"'"'")
SUPABASE_ANON=$(grep "^SUPABASE_ANON_KEY=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"'"'")
GOOGLE_ID=$(grep "^GOOGLE_CLIENT_ID=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"'"'")

create_env "VITE_API_URL" "https://arlong-gamma.vercel.app/api"
create_env "VITE_SUPABASE_URL" "$SUPABASE_URL"
create_env "VITE_SUPABASE_ANON_KEY" "$SUPABASE_ANON"
create_env "VITE_GOOGLE_CLIENT_ID" "$GOOGLE_ID"

echo ""
echo "Synchronisation terminee!"
echo "Verifiez: https://vercel.com/archlordroy-coder/arlong/settings/environment-variables"
