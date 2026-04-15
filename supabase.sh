#!/bin/bash

# Script de gestion Supabase pour Mboa Drive
# Usage: ./supabase.sh [migration_file.sql]

URL=$SUPABASE_URL
KEY=$SUPABASE_SERVICE_ROLE_KEY

if [ -z "$URL" ]; then
  echo "❌ Erreur: SUPABASE_URL manquant."
fi

if [ -z "$1" ]; then
  echo "✅ Script d'initialisation détecté."
else
  echo "🚀 Application de la modification : $1"
fi
