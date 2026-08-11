#!/usr/bin/env bash


set -Eeuo pipefail

declare -a DOCKER_PROJECTS=(
  "$HOME/docker/BumTeacherBypass"
  "$HOME/docker/actual-budget"
  "$HOME/docker/adguardhome"
  "$HOME/docker/snapotter"
  "$HOME/docker/stirling-pdf"
)

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

update_docker() {
  log "Starting Docker updates..."

  for projects in "${DOCKER_PROJECTS[@]}"; do 
    cd "${projects}"

    log "Updating Docker project: ${projects}"

    docker compose pull
    docker compose up -d

    log "Finished updating Docker project: ${projects}"
  done

  log "All Docker projects updated."
}

update_ubuntu() {
  log "Updating Ubuntu packages..."
  sudo apt update && sudo apt upgrade -y
  log "Ubuntu packages updated."
}

main(){
  update_docker
  update_ubuntu
}

main