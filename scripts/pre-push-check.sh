#!/bin/bash
# Vérification avant push GitHub
# Usage: ./scripts/pre-push-check.sh

echo "🔍 Vérification avant push GitHub"
echo "=============================================="
echo ""

ERRORS=0

# 1. Vérifier que .env* sont dans .gitignore
echo "1️⃣  Vérification du .gitignore..."
if grep -q "^\.env" .gitignore && grep -q "backend/\.env" .gitignore; then
    echo "   ✅ .gitignore configure correctement"
else
    echo "   ❌ .gitignore incomplet !"
    ERRORS=$((ERRORS + 1))
fi

# 2. Vérifier qu'aucun fichier .env n'est tracké
echo ""
echo "2️⃣  Vérification des fichiers trackés..."
TRACKED_ENV=$(git ls-files 2>/dev/null | grep -E "\.env|\.env\.local|\.env\.production" || true)
if [ -n "$TRACKED_ENV" ]; then
    echo "   ❌ Fichiers .env trackés détectés:"
    echo "$TRACKED_ENV" | sed 's/^/      - /'
    echo ""
    echo "   Pour les retirer:"
    echo "   git rm --cached $TRACKED_ENV"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Aucun fichier .env tracké"
fi

# 3. Vérifier les clés dans le code
echo ""
echo "3️⃣  Vérification des secrets dans le code..."
PATTERNS=(
    "sb_secret_"
    "sb_publishable_"
    "sk_live_"
    "pk_live_"
    "AIza"  # Google API keys
)

FOUND_SECRETS=""
for pattern in "${PATTERNS[@]}"; do
    matches=$(git diff --cached --name-only 2>/dev/null | xargs grep -l "$pattern" 2>/dev/null || true)
    if [ -n "$matches" ]; then
        FOUND_SECRETS="$FOUND_SECRETS$matches
"
    fi
done

if [ -n "$FOUND_SECRETS" ]; then
    echo "   ⚠️  Potentiels secrets détectés dans:"
    echo "$FOUND_SECRETS" | sort -u | sed 's/^/      - /'
    echo ""
    echo "   Vérifie que ce sont bien des variables d'environnement et non des clés en dur."
else
    echo "   ✅ Aucun secret détecté"
fi

# 4. Vérifier vercel.json
echo ""
echo "4️⃣  Vérification de vercel.json..."
if [ -f "vercel.json" ]; then
    if grep -q "sb_secret_" vercel.json || grep -q "sb_publishable_" vercel.json; then
        echo "   ❌ vercel.json contient des clés en dur !"
        echo "   Les clés doivent être configurées via 'vercel env add', pas dans vercel.json"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ vercel.json ne contient pas de clés en dur"
    fi
else
    echo "   ⚠️  vercel.json non trouvé"
fi

# 5. Résumé
echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ Tout est prêt pour le push !"
    echo ""
    echo "Commandes pour push:"
    echo "   git add ."
    echo "   git commit -m 'message'"
    echo "   git push"
    exit 0
else
    echo "❌ $ERRORS problème(s) détecté(s)"
    echo ""
    echo "Corrige les erreurs avant de push."
    exit 1
fi
