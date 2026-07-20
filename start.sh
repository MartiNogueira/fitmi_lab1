#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

is_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local tries=120

  for ((i = 1; i <= tries; i++)); do
    if is_listening "$port"; then
      echo "$name listo en puerto $port"
      return 0
    fi
    sleep 1
  done

  echo "No se detecto $name escuchando en puerto $port despues de ${tries}s"
  return 1
}

echo "Levantando Docker..."
cd "$ROOT_DIR"
docker compose up -d

echo "Esperando que PostgreSQL este listo..."
sleep 3

if is_listening "$BACKEND_PORT"; then
  echo "Backend ya esta usando el puerto $BACKEND_PORT; no levanto otro proceso."
  BACKEND_PID="existente"
else
  echo "Levantando Backend..."
  (
    cd "$ROOT_DIR/Backend"
    HOST=127.0.0.1 PORT="$BACKEND_PORT" npm run dev
  ) &
  BACKEND_PID=$!
fi

if is_listening "$FRONTEND_PORT"; then
  echo "Frontend ya esta usando el puerto $FRONTEND_PORT; no levanto otro proceso."
  FRONTEND_PID="existente"
else
  echo "Levantando Frontend..."
  (
    cd "$ROOT_DIR/Frontend"
    npm run dev -- --host localhost --port "$FRONTEND_PORT"
  ) &
  FRONTEND_PID=$!
fi

wait_for_port "$BACKEND_PORT" "Backend"
wait_for_port "$FRONTEND_PORT" "Frontend"

echo ""
echo "Fitmi corriendo!"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo ""
echo "Procesos iniciados: backend=$BACKEND_PID frontend=$FRONTEND_PID"
echo "Para cortar todo: Ctrl+C"

open "http://localhost:$FRONTEND_PORT"

wait
