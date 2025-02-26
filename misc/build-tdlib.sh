#!/bin/bash

ARCH=${1:-arm64}
DOCKERFILE="Dockerfile.tdlib-builder"
IMAGE_NAME="tdlib-builder"

if [ "$ARCH" == "arm64" ]; then
    OUTPUT_DIR="./tdlib/linux_arm64"
elif [ "$ARCH" == "x86_64" ]; then
    OUTPUT_DIR="./tdlib/linux_x86_64"
else
    echo "Unsupported architecture: $ARCH"
    echo "Usage: $0 [arm64|x86_64]"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Building $ARCH TDLib builder Docker image..."
docker build -t "$IMAGE_NAME" -f "$DOCKERFILE" .

echo "Running TDLib builder for $ARCH and extracting libraries..."
docker run --rm -v "$(pwd)/$OUTPUT_DIR":/app/tdlib "$IMAGE_NAME"

echo "Build complete! $ARCH TDLib libraries are available in the $OUTPUT_DIR directory"
echo "Structure:"
echo "- $OUTPUT_DIR/libtdjni.so"
