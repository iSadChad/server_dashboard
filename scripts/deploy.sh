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

main() {
  log "Starting deployment."

  cd "$PROJECT_DIR"

  check_repository_clean

  log "Initial checks completed."
}

main "$@"