#!/bin/bash

cd "$(dirname "$0")"
(lsof -t -i:5000 -i:5173 | xargs kill -9 2>/dev/null) || true
npm run dev
