#!/bin/bash
echo "🚀 Compilation de l'APK Arlong (Android)..."

# Aller dans le dossier mobile
cd frontend/mobile

# S'assurer que le plugin android est là
npm install @capacitor/android

# Builder le frontend web
echo "📦 Build du frontend mobile..."
npm run build

# Synchroniser avec Android
echo "🔄 Synchronisation Capacitor..."
npx cap add android 2>/dev/null || true
npx cap sync android

# Compiler l'APK via Gradle
echo "🏗️ Compilation native (Gradle)..."
cd android
./gradlew assembleDebug

echo "✅ APK généré avec succès !"
echo "📍 Chemin : frontend/mobile/android/app/build/outputs/apk/debug/app-debug.apk"
