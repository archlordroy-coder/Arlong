#!/bin/bash
set -e
echo "🚀 Installation des dépendances Web..."
cd "$(dirname "$0")/../frontend/web"
npm install
echo "✅ Frontend Web installé avec succès !"
