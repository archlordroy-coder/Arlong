#!/bin/bash
# Script pour supprimer les commits locaux problématiques
# Usage: ./scripts/reset-git-history.sh

echo "🗑️  Suppression des commits locaux problématiques"
echo "======================================================"
echo ""

# Vérifier qu'on est dans un repo git
if [ ! -d ".git" ]; then
    echo "❌ Pas un repository git"
    exit 1
fi

echo "📋 État actuel:"
git status

echo ""
echo "⚠️  Cette opération va:"
echo "   1. Annuler TOUS les commits locaux non poussés"
echo "   2. Conserver les modifications de fichiers"
echo "   3. Permettre un nouveau commit propre"
echo ""
echo "⚠️  ATTENTION: Les commits seront PERDUS définitivement !"
echo ""

read -p "Continuer ? (tape OUI pour confirmer): " confirm

if [ "$confirm" != "OUI" ]; then
    echo "Annulé."
    exit 0
fi

echo ""
echo "🔄 Reset des commits..."

# Option 1: Reset doux (garde les fichiers modifiés)
echo "📝 Option choisie: Reset doux (garde les modifications)"
git reset --soft HEAD~10 2>/dev/null || git reset --soft HEAD~5 2>/dev/null || git reset --soft HEAD~1

echo ""
echo "✅ Commits annulés !"
echo ""
echo "📋 Nouvel état:"
git status

echo ""
echo "======================================================"
echo "🎯 Prochaines étapes:"
echo ""
echo "1. Vérifier que les fichiers sont corrects"
echo "2. Corriger les secrets si nécessaire"
echo "3. git add ."
echo "4. git commit -m 'message propre'"
echo "5. git push --force-with-lease"
echo ""
echo "⚠️  Si les secrets sont encore présents, corrige-les AVANT de commit:"
echo "   - vercel.json (retirer les clés)"
echo "   - scripts/*.sh (retirer les clés en dur)"
