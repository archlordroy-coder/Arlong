#!/bin/bash
# Script pour nettoyer TOUS les caches locaux
# Usage: ./scripts/clear-all-caches.sh

echo "🧹 Nettoyage des caches locaux..."
echo "=============================================="

# 1. Supprimer node_modules/.cache
echo "1️⃣  Nettoyage cache npm..."
rm -rf /persistent/home/ravel/Arlong/node_modules/.cache 2>/dev/null
rm -rf /persistent/home/ravel/Arlong/backend/node_modules/.cache 2>/dev/null
rm -rf /persistent/home/ravel/Arlong/frontend/web/node_modules/.cache 2>/dev/null
echo "   ✅ Cache npm nettoyé"

# 2. Supprimer .vite
echo "2️⃣  Nettoyage cache Vite..."
rm -rf /persistent/home/ravel/Arlong/frontend/web/.vite 2>/dev/null
echo "   ✅ Cache Vite nettoyé"

# 3. Supprimer les logs npm
echo "3️⃣  Nettoyage logs npm..."
rm -f /persistent/home/ravel/Arlong/npm-debug.log* 2>/dev/null
rm -f /persistent/home/ravel/Arlong/backend/npm-debug.log* 2>/dev/null
rm -f /persistent/home/ravel/Arlong/frontend/web/npm-debug.log* 2>/dev/null
echo "   ✅ Logs npm nettoyés"

# 4. Nettoyer le cache Supabase local (si existe)
echo "4️⃣  Nettoyage cache Supabase local..."
rm -rf /persistent/home/ravel/Arlong/.supabase 2>/dev/null
rm -rf /persistent/home/ravel/Arlong/supabase/.temp 2>/dev/null
echo "   ✅ Cache Supabase nettoyé"

# 5. Nettoyer les fichiers temporaires
echo "5️⃣  Nettoyage fichiers temporaires..."
find /persistent/home/ravel/Arlong -name "*.tmp" -delete 2>/dev/null
find /persistent/home/ravel/Arlong -name ".DS_Store" -delete 2>/dev/null
echo "   ✅ Fichiers temporaires nettoyés"

echo ""
echo "=============================================="
echo "✅ Tous les caches locaux ont été nettoyés !"
echo ""
echo "Prochaines étapes :"
echo "1. npm install (si besoin)"
echo "2. npm run dev"
