#!/bin/bash
# Nettoyage complet de Vercel + Redéploiement
# LIT les variables depuis backend/.env.local (pas de secrets en dur)
# Usage: ./scripts/vercel-clean-redeploy.sh

echo "🧹 Nettoyage et redéploiement Vercel"
echo "=============================================="
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
    NEW_URL=$(grep "^SUPABASE_URL=" backend/.env.local | cut -d '=' -f2)
    NEW_ANON=$(grep "^SUPABASE_ANON_KEY=" backend/.env.local | cut -d '=' -f2)
    NEW_SERVICE=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" backend/.env.local | cut -d '=' -f2)
else
    echo "❌ backend/.env.local non trouvé !"
    exit 1
fi

echo "📋 Variables détectées:"
echo "   SUPABASE_URL: ${NEW_URL:0:30}..."
echo "   SUPABASE_ANON_KEY: ${NEW_ANON:0:30}..."
echo "   SUPABASE_SERVICE_ROLE_KEY: ${NEW_SERVICE:0:30}..."
echo ""

read -p "Es-tu connecté à Vercel ? (vercel login) - Continuer ? (o/n): " confirm
if [ "$confirm" != "o" ] && [ "$confirm" != "O" ]; then
    echo "Annulé."
    exit 0
fi

echo ""
echo "🗑️  ÉTAPE 1: Suppression des anciennes variables..."
echo "------------------------------------------------"

# Liste des variables à supprimer
VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_API_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_SUPABASE_PUBLISHABLE_KEY"
)

for var in "${VARS[@]}"; do
    echo "   Suppression de $var..."
    vercel env rm "$var" production -y 2>/dev/null || true
    vercel env rm "$var" preview -y 2>/dev/null || true
    vercel env rm "$var" development -y 2>/dev/null || true
done

echo ""
echo "✅ ÉTAPE 2: Ajout des nouvelles variables..."
echo "------------------------------------------------"

# Fonction pour ajouter une variable
declare_env() {
    local name=$1
    local value=$2
    echo "   → $name"
    
    # Production
    printf "%s" "$value" | vercel env add "$name" production 2>/dev/null || echo "     ⚠️ Erreur production (peut-être déjà existante)"
    
    # Preview
    printf "%s" "$value" | vercel env add "$name" preview 2>/dev/null || true
    
    # Development
    printf "%s" "$value" | vercel env add "$name" development 2>/dev/null || true
}

# Supabase
declare_env "SUPABASE_URL" "$NEW_URL"
declare_env "SUPABASE_ANON_KEY" "$NEW_ANON"
declare_env "SUPABASE_SERVICE_ROLE_KEY" "$NEW_SERVICE"
declare_env "VITE_SUPABASE_URL" "$NEW_URL"
declare_env "VITE_SUPABASE_ANON_KEY" "$NEW_ANON"
declare_env "VITE_SUPABASE_PUBLISHABLE_KEY" "$NEW_ANON"

# JWT (garder l'ancien ou en créer un nouveau)
JWT_SECRET="arlong_super_secret_key_change_me"
declare_env "JWT_SECRET" "$JWT_SECRET"
declare_env "JWT_EXPIRES_IN" "7d"

# Google OAuth (lire depuis .env.local)
GOOGLE_CLIENT=$(grep "^GOOGLE_CLIENT_ID=" backend/.env.local | cut -d '=' -f2)
GOOGLE_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" backend/.env.local | cut -d '=' -f2)
declare_env "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT"
declare_env "GOOGLE_CLIENT_SECRET" "$GOOGLE_SECRET"
declare_env "GOOGLE_REDIRECT_URI" "http://localhost:5000/api/auth/google/callback"

# Frontend URL
declare_env "FRONTEND_URL" "http://localhost:5173"

echo ""
echo "📋 ÉTAPE 3: Vérification des variables..."
echo "------------------------------------------------"
vercel env ls

echo ""
echo "🚀 ÉTAPE 4: Déploiement en production..."
echo "------------------------------------------------"
read -p "Déployer maintenant ? (o/n): " deploy
if [ "$deploy" = "o" ] || [ "$deploy" = "O" ]; then
    vercel --prod
else
    echo "⏸️  Déploiement annulé."
    echo "   Pour déployer plus tard: vercel --prod"
fi

echo ""
echo "=============================================="
echo "✅ Configuration terminée !"
echo ""
echo "Nouveau projet Supabase: cbdzvzaziybwxxnbhyty"
echo "Dashboard: https://app.supabase.com/project/cbdzvzaziybwxxnbhyty"
echo ""
echo "🔗 Pour vérifier le déploiement:"
echo "   vercel logs --production"
