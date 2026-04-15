# 🏗️ Mboa Drive V2.0 Architecture

## 1. Electron Secure Bridge
The Desktop version now uses `contextIsolation: true` and `nodeIntegration: false`.
All communication with the Node.js backend/system is done via the `preload.cjs` bridge.

## 2. Drive-First, Firebase-Mirror Logic
For performance, small files are mirrored to Firebase Storage.
- **Source of Truth:** Google Drive
- **Fast Cache:** Firebase CDN
- **Logic:** Files < 10MB are automatically copied to Firebase for instant previews in the UI.

## 3. Offline-First System
- **Local Database:** SQLite (via `better-sqlite3`) stores metadata locally.
- **Sync Queue:** Mutations performed offline are queued and synchronized when the connection is restored.
- **Network Monitor:** A DNS-based monitor detects connectivity changes.

## 4. AI Integration
- **Model:** Gemma 3 4B (via Google AI Studio).
- **Features:** OCR, Image Description, and a Contextual Chatbot that knows about the user's workspaces.
