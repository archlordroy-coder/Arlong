#!/bin/bash
set -e
echo "🚀 Installation des dépendances Backend..."
cd "$(dirname "$0")/../backend"
npm install
echo "✅ Backend installé avec succès !"
