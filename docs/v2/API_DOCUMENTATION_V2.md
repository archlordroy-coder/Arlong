# 📘 Mboa Drive API V2.0 Documentation

## 🚀 Overview
Version 2.0 introduces several new modules for collaboration, automation, and AI-powered archiving.

---

## 🔐 Admin & Versions
Manage application updates and admin-only features.

### GET `/api/versions/latest`
Returns the latest valid version for a given platform.
- **Query Params:** `platform` (desktop, web, mobile)

### POST `/api/versions` (Admin Only)
Create a new version.
- **Body:** `{ version_name, version_code, platform, download_url, notes, is_valid }`

---

## 🤝 Collaboration (Sharing)
Share folders and workspaces with other users.

### POST `/api/shares`
Share a resource.
- **Body:** `{ resourceId, resourceType, email, permission }`
- **Permissions:** `view`, `edit`, `admin`

### GET `/api/shares/me`
List all resources shared with the current user.

---

## 📧 Google Workspace (Gmail)
Integrated email capabilities.

### POST `/api/gmail/send`
Send an email with attachments from Mboa Drive.
- **Body:** `{ to, subject, body, archiveIds }`

---

## 🤖 AI Assistant (Gemma 4)
Contextual assistant and image processing.

### POST `/api/ai/chat`
Chat with Arlong AI.
- **Body:** `{ message, history, context }`

---

## 💬 WhatsApp & Bulk Send
Automation for WhatsApp and Excel imports.

### POST `/api/contacts`
Save a list of contacts from an Excel/CSV import.
- **Body:** `{ name, contacts, source_file }`
