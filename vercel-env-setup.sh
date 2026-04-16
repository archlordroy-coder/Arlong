#!/bin/bash

# =============================================================================
# Script d'aide pour configurer les variables d'environnement sur Vercel
# =============================================================================
# Usage: ./vercel-env-setup.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Configuration Vercel Environment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Vérifier si vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "Installez avec: npm i -g vercel"
    exit 1
fi

# Vérifier connexion
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
    echo "Connexion en cours..."
    vercel login
fi

# Lier le projet
echo -e "${BLUE}🔗 Liaison du projet...${NC}"
vercel link

echo ""
echo -e "${GREEN}✅ Projet lié!${NC}"
echo ""

# Fonction pour ajouter une variable
add_env_var() {
    local name=$1
    local description=$2
    
    echo -e "${YELLOW}➕ $name${NC}"
    echo -e "${BLUE}   $description${NC}"
    
    read -p "   Valeur: " value
    
    if [ -n "$value" ]; then
        echo "$value" | vercel env add "$name" production
        echo -e "${GREEN}   ✅ $name ajouté${NC}"
    else
        echo -e "${RED}   ⚠️  Valeur vide - ignoré${NC}"
    fi
    echo ""
}

echo -e "${BLUE}📋 Configuration des variables...${NC}"
echo ""

# Variables Supabase
echo -e "${YELLOW}=== SUPABASE (Obligatoire) ===${NC}"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "URL Supabase (ex: https://xxx.supabase.co)"
add_env_var "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" "Clé anonyme Supabase (anon public)"
add_env_var "SUPABASE_URL" "Même URL Supabase"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "Clé service role Supabase (pour admin)"

# Variables JWT
echo -e "${YELLOW}=== JWT (Obligatoire) ===${NC}"
echo -e "${BLUE}Générez une clé: openssl rand -base64 32${NC}"
add_env_var "JWT_SECRET" "Clé secrète JWT (min 32 caractères)"
echo -e "${BLUE}Valeur recommandée: 7d${NC}"
add_env_var "JWT_EXPIRES_IN" "Expiration JWT (ex: 7d)"

# Variables Google OAuth
echo -e "${YELLOW}=== GOOGLE OAUTH (Obligatoire) ===${NC}"
add_env_var "GOOGLE_CLIENT_ID" "Client ID Google Cloud Console"
add_env_var "GOOGLE_CLIENT_SECRET" "Client Secret Google Cloud Console"
echo -e "${BLUE}Valeur: https://arlong-gamma.vercel.app/api/auth/google/callback${NC}"
add_env_var "GOOGLE_REDIRECT_URI" "Redirect URI Google OAuth"

# Variables Frontend
echo -e "${YELLOW}=== FRONTEND (Obligatoire) ===${NC}"
echo -e "${BLUE}Valeur: https://arlong-gamma.vercel.app${NC}"
add_env_var "FRONTEND_URL" "URL frontend production"

# Variables Optionnelles
echo -e "${YELLOW}=== OPTIONNELLES ===${NC}"
echo -e "${BLUE}Appuyez ENTER pour ignorer${NC}"
add_env_var "GEMINI_API_KEY" "Clé Google AI (optionnel)"
add_env_var "UPDATE_SERVER_URL" "URL update server (optionnel)"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Vérification:${NC}"
vercel env ls

echo ""
echo -e "${YELLOW}🚀 Redéploiement:${NC}"
echo "vercel --prod"
echo ""
