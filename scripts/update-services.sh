#!/usr/bin/env bash


set -Eeuo pipefail


log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

update_docker() {
  log "Updating Docker images..."
  docker compose pull
  docker compose up -d
  log "Docker images updated."
}

update_ubuntu() {
  log "Updating Ubuntu packages..."
  sudo apt update && sudo apt upgrade -y
  log "Ubuntu packages updated."
}