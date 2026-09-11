#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cleanup() {
  [[ -n "${BACKEND_PID:-}" ]] && kill "${BACKEND_PID}" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "${FRONTEND_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ -f "${ROOT_DIR}/backend/src/index.ts" ]]; then
  (cd "${ROOT_DIR}/backend" && npm run dev) &
  BACKEND_PID=$!
else
  printf '[RE-DAY] backend/src/index.ts가 없어 Backend 실행을 건너뜁니다.\n'
fi
(cd "${ROOT_DIR}/frontend" && npm run dev) &
FRONTEND_PID=$!
wait
