#!/usr/bin/env bash
# ar.lobodoc.com 자체 서버 배포 — 도메인 루트(base '/')로 빌드 후 rsync 업로드.
#
# 사용 예:
#   DEPLOY_HOST=1.2.3.4 DEPLOY_USER=deploy DEPLOY_PATH=/var/www/ar.lobodoc.com \
#   DEPLOY_KEY=~/.ssh/id_ed25519 bash scripts/deploy-server.sh
#
# 필수: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH   (DEPLOY_KEY 는 선택: SSH 개인키)
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST 필요}"
: "${DEPLOY_USER:?DEPLOY_USER 필요}"
: "${DEPLOY_PATH:?DEPLOY_PATH 필요 (예: /var/www/ar.lobodoc.com)}"

cd "$(dirname "$0")/../frontend"

echo "▶ 빌드 (base '/')"
BASE_PATH=/ npm run build

SSH_OPTS="-o StrictHostKeyChecking=accept-new"
[ -n "${DEPLOY_KEY:-}" ] && SSH_OPTS="$SSH_OPTS -i $DEPLOY_KEY"

echo "▶ 업로드 → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
rsync -avz --delete -e "ssh $SSH_OPTS" dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "✓ 배포 완료 — https://ar.lobodoc.com/"
