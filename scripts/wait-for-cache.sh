#!/bin/bash
# Attendre que le cache PostgREST se rafraîchisse

echo "⏳ Attente du rafraîchissement du cache PostgREST..."
echo "   Le cache expire automatiquement après quelques minutes."
echo ""

for i in {1..30}; do
    echo -n "."
    
    # Tester si created_at fonctionne
    result=$(curl -s "http://localhost:5000/api/admin/schema-status" 2>/dev/null | grep -o '"Document.created_at": "OK ✅"' || echo "")
    
    if [ -n "$result" ]; then
        echo ""
        echo "✅ Cache rafraîchi ! Toutes les colonnes sont accessibles."
        exit 0
    fi
    
    sleep 10
done

echo ""
echo "⚠️ Le cache n'est pas encore rafraîchi."
echo "Solution :"
echo "1. Attendre encore 2-3 minutes"
echo "2. Ou redémarrer le projet dans Supabase Dashboard (Settings → API → Restart)"
