#!/bin/bash
set -e
echo "🚀 Installation des dépendances Mobile..."
cd "$(dirname "$0")/../frontend/mobile"
npm install
echo "✅ Frontend Mobile installé avec succès !"
