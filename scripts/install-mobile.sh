#!/bin/bash
set -e
echo "🚀 Installation des dépendances Mobile..."
cd "$(dirname "$0")/../frontend/mobile"
npm install
npm install express
npm install cors
npm install dotenv
npm install bcryptjs
npm install jsonwebtoken 
echo "✅ Frontend Mobile installé avec succès !"
