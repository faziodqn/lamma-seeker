#!/usr/bin/env bash
# Installs the 2-day seeker timer as a systemd *user* unit.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p ~/.config/systemd/user
cp systemd/lamma-seek.service systemd/lamma-seek.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now lamma-seek.timer
systemctl --user list-timers lamma-seek.timer
