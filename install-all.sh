#!/bin/bash
set -e
echo "🌟 Installation Globale Mboa Drive 🌟"
echo "-----------------------------------"

# Installe d'abord la racine si elle contient ses propres dépendances (ex: yarn/npm concurrently)
npm install

# Appelle les scripts individuels
bash scripts/install-backend.sh
bash scripts/install-web.sh
bash scripts/install-mobile.sh
bash scripts/install-desktop.sh

echo "-----------------------------------"
echo "🎉 Tout est installé, le projet est prêt ! 🎉"
