#!/bin/bash
set -e
echo "🚀 Installation des dépendances Desktop..."
cd "$(dirname "$0")/../frontend/desktop"
npm install
echo "✅ Frontend Desktop installé avec succès !"
