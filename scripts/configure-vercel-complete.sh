#!/bin/bash
# Configuration des variables Vercel - LIT depuis .env.local (PAS de secrets en dur)
# Usage: ./scripts/configure-vercel-complete.sh

echo "🔧 Configuration Vercel"
echo "======================================================"
echo ""

# Vérifier si vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ vercel CLI non installé"
    echo "   npm i -g vercel"
    exit 1
fi

# Lire les variables depuis .env.local
echo "📖 Lecture des variables depuis backend/.env.local..."
if [ -f "backend/.env.local" ]; then
    # Extraire les valeurs (ignorer les commentaires)
    SUPABASE_URL=$(grep "^SUPABASE_URL=" backend/.env.local | cut -d '=' -f2)
    SUPABASE_ANON=$(grep "^SUPABASE_ANON_KEY=" backend/.env.local | cut -d '=' -f2)
    SUPABASE_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" backend/.env.local | cut -d '=' -f2)
    GOOGLE_CLIENT=$(grep "^GOOGLE_CLIENT_ID=" backend/.env.local | cut -d '=' -f2)
    GOOGLE_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" backend/.env.local | cut -d '=' -f2)
else
    echo "❌ backend/.env.local non trouvé !"
    exit 1
fi

echo "Variables détectées:"
echo "  SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "  SUPABASE_ANON_KEY: ${SUPABASE_ANON:0:30}..."
echo "  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE:0:30}..."
echo ""

read -p "Continuer avec ces variables ? (o/n): " confirm

if [ "$confirm" != "o" ] && [ "$confirm" != "O" ]; then
    echo "Annulé."
    exit 0
fi

echo ""
echo "🚀 Configuration Vercel..."

# Fonction pour ajouter une variable
declare_env() {
    local name=$1
    local value=$2
    echo "  → $name"
    # Utiliser printf pour éviter les problèmes avec les caractères spéciaux
    printf "%s" "$value" | vercel env add "$name" production 2>/dev/null || echo "     ⚠️ déjà existe ou erreur"
}

# Supprimer les anciennes variables
echo ""
echo "⚠️  Suppression des anciennes variables..."
for var in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY VITE_SUPABASE_PUBLISHABLE_KEY JWT_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
    vercel env rm "$var" production -y 2>/dev/null || true
done

# Ajouter les nouvelles
echo ""
echo "✅ Ajout des nouvelles variables..."
declare_env "SUPABASE_URL" "$SUPABASE_URL"
declare_env "SUPABASE_ANON_KEY" "$SUPABASE_ANON"
declare_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE"
declare_env "VITE_SUPABASE_URL" "$SUPABASE_URL"
declare_env "VITE_SUPABASE_ANON_KEY" "$SUPABASE_ANON"
declare_env "VITE_SUPABASE_PUBLISHABLE_KEY" "$SUPABASE_ANON"
declare_env "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT"
declare_env "GOOGLE_CLIENT_SECRET" "$GOOGLE_SECRET"
declare_env "JWT_SECRET" "arlong_super_secret_key_change_me"
declare_env "JWT_EXPIRES_IN" "7d"

echo ""
echo "======================================================"
echo "✅ Configuration terminée !"
echo ""
echo "Variables configurées:"
vercel env ls
echo ""
echo "Redéploiement: vercel --prod"
