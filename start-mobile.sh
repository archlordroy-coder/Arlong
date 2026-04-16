#!/bin/bash

cd "$(dirname "$0")"
(lsof -t -i:5000 -i:5173 | xargs kill -9 2>/dev/null) || true
npm run dev:backend &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null' EXIT
npm run start:mobile
