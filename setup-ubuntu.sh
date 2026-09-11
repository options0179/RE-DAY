#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_LTS_CHANNEL="${NODE_LTS_CHANNEL:-lts/*}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-4000}"

log() {
  printf '\n[RE-DAY] %s\n' "$1"
}

require_ubuntu_24() {
  if [[ ! -r /etc/os-release ]]; then
    printf 'Ubuntu 24.04 LTS가 필요합니다.\n' >&2
    exit 1
  fi

  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID}" != "ubuntu" || "${VERSION_ID}" != "24.04" ]]; then
    printf 'Ubuntu 24.04 LTS에서 실행하십시오. 현재: %s %s\n' "${ID}" "${VERSION_ID}" >&2
    exit 1
  fi
}

install_system_packages() {
  log "기본 패키지 설치"
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    jq \
    unzip \
    zip \
    build-essential \
    python3 \
    python3-pip \
    python3-venv
}

install_node() {
  log "Node.js LTS와 npm 설치"
  export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"

  if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi

  # shellcheck disable=SC1090
  source "${NVM_DIR}/nvm.sh"
  nvm install "${NODE_LTS_CHANNEL}"
  nvm alias default "${NODE_LTS_CHANNEL}"
  nvm use default
  npm install --global npm@latest
}

install_docker() {
  log "Docker Engine과 Docker Compose 설치"
  sudo install -m 0755 -d /etc/apt/keyrings

  if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
  fi

  # shellcheck disable=SC1091
  source /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" |
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

  sudo systemctl enable --now docker
  sudo usermod -aG docker "${USER}"
}

install_firebase_cli() {
  log "Firebase CLI 설치"
  export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
  # shellcheck disable=SC1090
  source "${NVM_DIR}/nvm.sh"
  npm install --global firebase-tools
}

configure_frontend() {
  log "Frontend 의존성 및 명령 설정"
  cd "${ROOT_DIR}/frontend"
  npm install next@^15 react@^18 react-dom@^18
  npm install --save-dev \
    typescript \
    @types/node \
    @types/react \
    @types/react-dom \
    tailwindcss \
    @tailwindcss/postcss \
    postcss \
    eslint \
    eslint-config-next \
    prettier \
    prettier-plugin-tailwindcss
  npm pkg set scripts.dev="next dev" scripts.build="next build" scripts.start="next start" scripts.lint="next lint"
}

configure_backend() {
  log "Backend 의존성 및 명령 설정"
  cd "${ROOT_DIR}/backend"
  npm install express cors helmet dotenv zod firebase-admin @modelcontextprotocol/sdk
  npm install --save-dev typescript tsx @types/node @types/express @types/cors
  npm pkg set scripts.dev="tsx watch src/index.ts" scripts.build="tsc --noEmit" scripts.test="node --test"
}

create_environment_files() {
  log "환경변수 파일 생성"

  if [[ ! -f "${ROOT_DIR}/backend/.env" ]]; then
    cat > "${ROOT_DIR}/backend/.env" <<EOF
NODE_ENV=development
PORT=${BACKEND_PORT}
CORS_ORIGIN=http://localhost:${FRONTEND_PORT}
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
COPILOT_AGENT_ENDPOINT=
COPILOT_AGENT_TOKEN=
MCP_SERVER_URL=
EOF
  fi

  if [[ ! -f "${ROOT_DIR}/frontend/.env.local" ]]; then
    cat > "${ROOT_DIR}/frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
EOF
  fi

  chmod 600 "${ROOT_DIR}/backend/.env" "${ROOT_DIR}/frontend/.env.local"
}

create_firebase_config() {
  log "Firebase Emulator 설정 생성"

  if [[ ! -f "${ROOT_DIR}/firebase.json" ]]; then
    cat > "${ROOT_DIR}/firebase.json" <<'EOF'
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4001 }
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": { "rules": "storage.rules" }
}
EOF
  fi

  [[ -f "${ROOT_DIR}/firestore.rules" ]] || printf '%s\n' \
    "rules_version = '2';" \
    "service cloud.firestore {" \
    "  match /databases/{database}/documents {" \
    "    match /{document=**} {" \
    "      allow read, write: if false;" \
    "    }" \
    "  }" \
    "}" > "${ROOT_DIR}/firestore.rules"

  [[ -f "${ROOT_DIR}/storage.rules" ]] || printf '%s\n' \
    "rules_version = '2';" \
    "service firebase.storage {" \
    "  match /b/{bucket}/o {" \
    "    match /{allPaths=**} {" \
    "      allow read, write: if false;" \
    "    }" \
    "  }" \
    "}" > "${ROOT_DIR}/storage.rules"

  [[ -f "${ROOT_DIR}/firestore.indexes.json" ]] || printf '%s\n' \
    '{' \
    '  "indexes": [],' \
    '  "fieldOverrides": []' \
    '}' > "${ROOT_DIR}/firestore.indexes.json"

  [[ -f "${ROOT_DIR}/.firebaserc" ]] || printf '%s\n' \
    '{' \
    '  "projects": {' \
    '    "default": ""' \
    '  }' \
    '}' > "${ROOT_DIR}/.firebaserc"
}

create_docker_compose() {
  log "Docker Compose 설정 생성"
  if [[ -f "${ROOT_DIR}/docker-compose.yml" ]]; then
    return
  fi

  cat > "${ROOT_DIR}/docker-compose.yml" <<'EOF'
services:
  firebase-emulator:
    image: andreysenov/firebase-tools:latest
    working_dir: /workspace
    volumes:
      - ./:/workspace
    ports:
      - "4001:4001"
      - "8080:8080"
      - "9099:9099"
      - "9199:9199"
    command: >
      firebase emulators:start
      --project demo-re-day
      --import=/workspace/.firebase-data
      --export-on-exit
EOF
}

protect_local_files() {
  log ".gitignore 보완"
  touch "${ROOT_DIR}/.gitignore"
  for entry in "backend/.env" "frontend/.env.local" ".firebase/" ".firebase-data/" "service-account*.json"; do
    grep -qxF "${entry}" "${ROOT_DIR}/.gitignore" || printf '%s\n' "${entry}" >> "${ROOT_DIR}/.gitignore"
  done
}

create_run_script() {
  log "개발 실행 스크립트 생성"
  cat > "${ROOT_DIR}/run-dev.sh" <<'EOF'
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
EOF
  chmod +x "${ROOT_DIR}/run-dev.sh"
}

validate_installation() {
  log "설치 확인"
  git --version
  node --version
  npm --version
  docker --version
  docker compose version
  firebase --version

  if [[ -d "${ROOT_DIR}/backend/src" ]]; then
    cd "${ROOT_DIR}/backend"
    npm run build
    npm test
  else
    printf '[RE-DAY] backend/src가 없어 Backend 검증을 건너뜁니다.\n'
  fi

  cd "${ROOT_DIR}/frontend"
  npm run build
}

main() {
  require_ubuntu_24
  install_system_packages
  install_node
  install_docker
  install_firebase_cli
  configure_frontend
  configure_backend
  create_environment_files
  create_firebase_config
  create_docker_compose
  protect_local_files
  create_run_script
  validate_installation

  log "완료"
  printf 'Firebase Emulator: http://localhost:4001\n'
  printf 'Frontend: http://localhost:%s\n' "${FRONTEND_PORT}"
  printf 'Backend: http://localhost:%s\n' "${BACKEND_PORT}"
  printf '실행: ./run-dev.sh\n'
}

main "$@"
