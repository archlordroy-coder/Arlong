#!/bin/bash
# Configuration des variables d'environnement sur Vercel pour le NOUVEAU projet Supabase
# Usage: ./scripts/setup-vercel-new-project.sh

echo "🔧 Configuration Vercel - Nouveau projet Supabase"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Tu dois avoir la CLI Vercel installée:"
echo "   npm i -g vercel"
echo ""
echo "Variables à configurer:"
echo ""

# Nouvelles variables Supabase
NEW_URL="https://cbdzvzaziybwxxnbhyty.supabase.co"
NEW_ANON="sb_publishable_YE7leKCGHF1O5Q7c_IQvXQ_IoW3ITfl"

echo "1. SUPABASE_URL=$NEW_URL"
echo "2. SUPABASE_ANON_KEY=$NEW_ANON"
echo "3. VITE_SUPABASE_URL=$NEW_URL"
echo "4. VITE_SUPABASE_ANON_KEY=$NEW_ANON"
echo "5. VITE_SUPABASE_PUBLISHABLE_KEY=$NEW_ANON"
echo ""
echo "6. SUPABASE_SERVICE_ROLE_KEY=[À COPIER DEPUIS SUPABASE DASHBOARD]"
echo "   → https://app.supabase.com/project/cbdzvzaziybwxxnbhyty/settings/api"
echo ""
echo "7. JWT_SECRET=[Garder l'ancien ou en générer un nouveau]"
echo "8. GOOGLE_CLIENT_ID=[Garder l'ancien]"
echo "9. GOOGLE_CLIENT_SECRET=[Garder l'ancien]"
echo ""

read -p "As-tu copié la SERVICE ROLE KEY ? (o/n): " has_key

if [ "$has_key" = "o" ] || [ "$has_key" = "O" ]; then
    read -p "Colle la SERVICE ROLE KEY: " service_key
    
    echo ""
    echo "🚀 Configuration des variables..."
    
    # Supprimer les anciennes variables (optionnel)
    echo "⚠️  Pour supprimer les anciennes variables manuellement:"
    echo "   vercel env rm SUPABASE_URL"
    echo ""
    
    # Ajouter les nouvelles
    echo "$NEW_URL" | vercel env add SUPABASE_URL production
    echo "$NEW_ANON" | vercel env add SUPABASE_ANON_KEY production
    echo "$service_key" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
    echo "$NEW_URL" | vercel env add VITE_SUPABASE_URL production
    echo "$NEW_ANON" | vercel env add VITE_SUPABASE_ANON_KEY production
    echo "$NEW_ANON" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
    
    echo ""
    echo "✅ Variables configurées !"
    echo ""
    echo "🔍 Vérification:"
    vercel env ls
else
    echo ""
    echo "❌ Va d'abord chercher la SERVICE ROLE KEY:"
    echo "   https://app.supabase.com/project/cbdzvzaziybwxxnbhyty/settings/api"
    echo ""
    echo "Puis relance ce script."
fi
