#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="/home/sadchad/dashboard/server_dashboard"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

check_repository_clean() {
  log "Checking repository for local changes..."

  local changes
  changes="$(git status --porcelain)"

  if [[ -n "$changes" ]]; then
    log "Deployment aborted: local changes detected."
    echo
    echo "$changes"
    exit 1
  fi

  log "Repository is clean."
}

pull() {
  log "Pulling latest changes..."
  git pull --ff-only
  log "Latest changes pulled."
}

npm_ci() {
  log "Installing dependencies using npm ci..."
  npm ci
  log "Dependencies installed."
}

npm_run_build() {
  log "Running npm build..."
  npm run build
  log "Build completed."
}

pm2_restart() {
  log "Restarting PM2 process..."
  pm2 restart server-dashboard
  log "PM2 process restarted."
}

main() {
  log "Starting deployment."

  cd "$PROJECT_DIR"

  check_repository_clean
  pull
  npm_ci
  npm_run_build
  pm2_restart
  log "Deployment completed successfully."
}

main "$@"