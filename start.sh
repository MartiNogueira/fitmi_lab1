#!/bin/bash

echo "🐳 Levantando Docker..."
docker compose up -d

echo "⏳ Esperando que PostgreSQL esté listo..."
sleep 3

echo "🚀 Levantando Backend..."
cd Backend && npm run dev &

echo "⚡ Levantando Frontend..."
cd ../Frontend && npm run dev &

echo ""
echo "✅ Fitmi corriendo!"
echo "👉 Frontend: http://localhost:5173"
echo "👉 Backend:  http://localhost:3000"

sleep 3
open http://localhost:5173

