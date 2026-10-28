#!/usr/bin/env bash
# Build multi-arch (amd64 + arm64) et push vers un registry (GHCR par défaut).
# Usage : IMAGE_PREFIX=ghcr.io/<user>/docker-eval ./scripts/publish.sh 1.0.0
set -euo pipefail

VERSION="${1:?Usage: IMAGE_PREFIX=ghcr.io/<user>/docker-eval $0 X.Y.Z}"
: "${IMAGE_PREFIX:?Définir IMAGE_PREFIX, ex : ghcr.io/<user>/docker-eval}"

MINOR="${VERSION%.*}"                    # 1.0.0 -> 1.0
SHA="$(git rev-parse --short HEAD)"
PLATFORMS="linux/amd64,linux/arm64"

for svc in backend frontend; do
  IMAGE="${IMAGE_PREFIX}-${svc}"
  echo ">>> ${IMAGE} (${PLATFORMS})"
  docker buildx build \
    --platform "${PLATFORMS}" \
    --target production \
    --provenance=mode=max \
    --sbom=true \
    -t "${IMAGE}:${VERSION}" \
    -t "${IMAGE}:${MINOR}" \
    -t "${IMAGE}:latest" \
    -t "${IMAGE}:sha-${SHA}" \
    --push \
    "./${svc}"
done
