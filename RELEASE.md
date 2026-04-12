# 🚀 Mboa Drive v1.0.1 — Notes de Version

<p align="center">
  <img src="MboaDrive.png" alt="Mboa Drive Logo" width="200"/>
</p>

<p align="center">
  <strong>Système de Gestion d'Archives Multiplateforme — Projet Scolaire</strong>
</p>

---

## 📥 Téléchargements

| Plateforme | Fichier | Description |
|---|---|---|
| 🐧 Linux | `MboaDrive-1.0.1.AppImage` | Exécutable portable (aucune installation requise) |
| 🪟 Windows | `MboaDrive Setup 1.0.1.exe` | Installeur Windows classique |
| 📱 Android | `MboaDrive.apk` | Application mobile Android |
| 🌐 Web | [arlong-gamma.vercel.app](https://arlong-gamma.vercel.app) | Version en ligne hébergée |

---

## ✨ Nouveautés de cette version

- **Architecture centralisée** : Les versions Desktop et Mobile se connectent désormais au backend hébergé sur Vercel (`arlong-gamma.vercel.app/api`), unifiant l'authentification et l'accès aux données Google Drive sur toutes les plateformes.
- **Branding Mboa Drive** : Nom d'application, icônes et métadonnées uniformisés sur l'ensemble des cibles de compilation.
- **Migration Linux vers AppImage** : Le format de distribution Linux passe du `.deb` (Debian uniquement) au `.AppImage` (compatible avec la majorité des distributions Linux).
- **Correction du chargement Desktop** : Résolution du bug `ERR_FILE_NOT_FOUND` empêchant le chargement des assets CSS/JS dans la version Electron.
- **Renommage APK** : Le fichier Android généré s'appelle désormais `MboaDrive.apk` au lieu de `app-debug.apk`.

---

## 🛠️ Stack Technique

| Composant | Technologie |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 6 |
| Backend | Node.js 24, Express 5, Supabase |
| Stockage Cloud | Google Drive API |
| Desktop | Electron 41, electron-builder |
| Mobile | Capacitor 8, Gradle 9.2.1, Java 21 |
| CI/CD | GitHub Actions (multiplateforme) |

---

## 📋 Instructions d'installation

### 🐧 Linux (AppImage)
```bash
chmod +x ARLONG-1.0.1.AppImage
./ARLONG-1.0.1.AppImage
```

### 🪟 Windows
Double-cliquer sur `ARLONG Setup 1.0.1.exe` et suivre l'assistant d'installation.

### 📱 Android
1. Activer **"Sources inconnues"** dans `Paramètres > Sécurité`.
2. Ouvrir le fichier `ARLONG.apk` et confirmer l'installation.

### 🌐 Web
Aucune installation requise. Accéder directement à [arlong-gamma.vercel.app](https://arlong-gamma.vercel.app).

---

## 👨‍🎓 Contexte

Ce projet a été réalisé dans un cadre scolaire. Il démontre la capacité à concevoir et déployer une application complète multiplateforme avec une architecture centralisée Backend-as-a-Service.

---

**Mboa Drive Team** • 2026
