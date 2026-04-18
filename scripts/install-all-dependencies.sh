#!/bin/bash
# Script pour installer toutes les dépendances du projet
# Usage: ./scripts/install-all-dependencies.sh

echo "📦 Installation de toutes les dépendances"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour installer les dépendances
install_deps() {
    local dir=$1
    local name=$2
    
    echo "🔧 Installation: $name"
    cd "$dir" || return 1
    
    if [ ! -f "package.json" ]; then
        echo "${RED}❌ package.json non trouvé dans $dir${NC}"
        return 1
    fi
    
    if [ -d "node_modules" ]; then
        echo "${YELLOW}⚠️  node_modules existe déjà, mise à jour...${NC}"
    fi
    
    npm install --legacy-peer-deps 2>&1
    
    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ $name installé${NC}"
    else
        echo "${RED}❌ Erreur installation $name${NC}"
        return 1
    fi
    echo ""
}

# 1. Root
echo "1️⃣  Installation root..."
cd /persistent/home/ravel/Arlong
install_deps "." "Root"

# 2. Backend
echo "2️⃣  Installation backend..."
cd /persistent/home/ravel/Arlong
install_deps "backend" "Backend"

# 3. Frontend Web
echo "3️⃣  Installation frontend web..."
cd /persistent/home/ravel/Arlong
install_deps "frontend/web" "Frontend Web"

# Vérification finale
echo ""
echo "=============================================="
echo "🔍 Vérification finale"
echo "=============================================="

cd /persistent/home/ravel/Arlong

# Vérifier que les modules sont installés
if [ -d "node_modules" ] && [ -d "backend/node_modules" ] && [ -d "frontend/web/node_modules" ]; then
    echo "${GREEN}✅ Toutes les dépendances sont installées !${NC}"
    echo ""
    echo "Tu peux maintenant lancer l'application:"
    echo "  npm run dev"
    exit 0
else
    echo "${RED}❌ Certaines dépendances sont manquantes${NC}"
    exit 1
fi
