#!/usr/bin/env python3
"""
Synchronise le backend/.env.local vers les variables d'environnement Vercel.
Usage: VERCEL_TOKEN=xxx python3 sync_vercel_env.py
"""
import os, sys, json, urllib.request, urllib.error

PROJECT_ID = "prj_UYG7ES5uvCidngA69kzytE5822K4"
TEAM_ID    = "team_tgFmSXLV17fYHSHuPc3M6nqj"
TOKEN      = os.environ.get("VERCEL_TOKEN", "")

if not TOKEN:
    print("❌ VERCEL_TOKEN manquant. Usage: VERCEL_TOKEN=xxx python3 sync_vercel_env.py")
    sys.exit(1)

BASE = f"https://api.vercel.com/v10/projects/{PROJECT_ID}/env?teamId={TEAM_ID}"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def vercel_request(method, url, payload=None):
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, method=method, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), None
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
        return None, body.get("error", {}).get("message", str(e))

# ── 1. Lire le .env.local ────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
env_file = os.path.join(SCRIPT_DIR, "backend", ".env.local")
if not os.path.exists(env_file):
    env_file = os.path.join(SCRIPT_DIR, "backend", ".env")

print(f"📄 Source: {env_file}")

local_vars = {}
with open(env_file, "r") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        local_vars[key] = val

# ── 2. Overrides pour la production ─────────────────────────────────────────
PROD_OVERRIDES = {
    "GOOGLE_REDIRECT_URI": "https://arlong-gamma.vercel.app/api/auth/google/callback",
    "FRONTEND_URL":        "https://arlong-gamma.vercel.app",
}

# Variables à ne pas envoyer sur Vercel
SKIP = {
    "FIREBASE_SERVICE_ACCOUNT", "FIREBASE_BUCKET",
    "UPDATE_SERVER_URL", "DATABASE_URL",
    "GOOGLE_REFRESH_TOKEN", "VERCEL_TOKEN",
}

# Variables VITE_ supplémentaires pour le frontend
VITE_EXTRAS = {
    "VITE_API_URL":          "https://arlong-gamma.vercel.app/api",
    "VITE_SUPABASE_URL":     local_vars.get("SUPABASE_URL", ""),
    "VITE_SUPABASE_ANON_KEY": local_vars.get("SUPABASE_ANON_KEY", ""),
    "VITE_GOOGLE_CLIENT_ID": local_vars.get("GOOGLE_CLIENT_ID", ""),
}

# Fusionner tout
all_vars = {}
for k, v in local_vars.items():
    if k in SKIP:
        continue
    all_vars[k] = PROD_OVERRIDES.get(k, v)

for k, v in VITE_EXTRAS.items():
    if v:
        all_vars[k] = v

# ── 3. Supprimer les variables existantes ───────────────────────────────────
print("\n🔍 Récupération des variables existantes...")
data, err = vercel_request("GET", BASE)
if err:
    print(f"❌ Erreur: {err}")
    sys.exit(1)

existing = data.get("envs", [])
print(f"🗑️  Suppression de {len(existing)} variable(s)...")
for env in existing:
    _, err = vercel_request("DELETE",
        f"https://api.vercel.com/v10/projects/{PROJECT_ID}/env/{env['id']}?teamId={TEAM_ID}")
    status = "✅" if not err else f"❌ {err}"
    print(f"  Deleted {env['key']}: {status}")

# ── 4. Créer les nouvelles variables ─────────────────────────────────────────
print(f"\n➕ Ajout de {len(all_vars)} variable(s)...")
ok = 0
errors = []
for key, value in all_vars.items():
    if not value:
        print(f"  {key}: ⏭ (vide, ignoré)")
        continue
    
    payload = {
        "key": key,
        "value": value,
        "type": "encrypted",
        "target": ["production", "preview", "development"]
    }
    result, err = vercel_request("POST", BASE, payload)
    if result and "id" in result:
        print(f"  {key}: ✅")
        ok += 1
    else:
        print(f"  {key}: ❌ {err}")
        errors.append(key)

# ── 5. Résumé ─────────────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"✅ {ok}/{len(all_vars)} variables synchronisées avec succès")
if errors:
    print(f"❌ Erreurs sur: {', '.join(errors)}")
print(f"\n👉 Vérifiez: https://vercel.com/archlordroy-coder/arlong/settings/environment-variables")
print(f"🚀 Redéployez: https://vercel.com/archlordroy-coder/arlong/deployments")
