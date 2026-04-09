#!/bin/bash
set -e
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

# Forcer l'utilisation de Gradle local seulement si on n'est PAS sur GitHub Actions
if [ -z "$GITHUB_ACTIONS" ]; then
    echo "🔧 Configuration Gradle Local (Détecté : Machine locale)..."
    PROPS_FILE="android/gradle/wrapper/gradle-wrapper.properties"
    sed -i 's|^distributionUrl=.*|distributionUrl=../../../gradle-9.2.1-all.zip|' "$PROPS_FILE"
else
    echo "☁️ Configuration Cloud (Détecté : GitHub Actions)..."
    # Sur GitHub Actions, on laisse la configuration standard qui téléchargera Gradle proprement
fi

# Compiler l'APK via Gradle
echo "🏗️ Compilation native (Gradle)..."
cd android
chmod +x gradlew
./gradlew assembleDebug

echo "✅ APK généré avec succès !"
echo "📍 Chemin : frontend/mobile/android/app/build/outputs/apk/debug/app-debug.apk"
