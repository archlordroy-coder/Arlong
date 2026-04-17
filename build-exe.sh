#!/bin/bash
set -e
echo "🏗️ Compilation de l'EXE Mboa Drive (Windows)..."
cd frontend/desktop
npm run build
npx electron-builder build --win --x64
echo "✅ EXE généré dans frontend/desktop/dist_electron/"
