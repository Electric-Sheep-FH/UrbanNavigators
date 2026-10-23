#!/usr/bin/env bash
# Construit les images de tous les services en local, puis (avec --k3d) les importe dans le cluster k3d.
#   ./scripts/build-images.sh --k3d
set -euo pipefail
cd "$(dirname "$0")/.."

REGISTRY="${REGISTRY:-un-local}"
TAG="${TAG:-dev}"
images=()

for dir in apps/*/; do
  service="$(basename "$dir")"
  dockerfile=docker/service.Dockerfile
  [ "$service" = web ] && dockerfile=docker/web.Dockerfile

  image="$REGISTRY/un-$service:$TAG"
  echo "==> $image"
  docker build -f "$dockerfile" --build-arg SERVICE="$service" -t "$image" .
  images+=("$image")
done

if [ "${1:-}" = "--k3d" ]; then
  k3d image import --cluster urbannavigators "${images[@]}"
fi
