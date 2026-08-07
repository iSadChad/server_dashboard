#!/usr//bin/env bash


set -Eeuo pipefail

PROJECT_DIR="/home/sadchad"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

