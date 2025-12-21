#!/bin/bash

# Configuration
IMAGE_NAME="aura"
IMAGE_TAG="latest"
OUTPUT_FILE="aura-offline.tar"

# Ensure we are in the project root (assuming script is in scripts/offline)
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PROJECT_ROOT=$(dirname "$(dirname "$SCRIPT_DIR")")

echo "Project Root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Build the image
echo "Building Docker image: $IMAGE_NAME:$IMAGE_TAG..."
docker build -t "$IMAGE_NAME:$IMAGE_TAG" .

if [ $? -ne 0 ]; then
    echo "Error: Docker build failed."
    exit 1
fi

# Save the image
echo "Saving image to $OUTPUT_FILE..."
docker save -o "$OUTPUT_FILE" "$IMAGE_NAME:$IMAGE_TAG"

if [ $? -ne 0 ]; then
    echo "Error: Failed to save image."
    exit 1
fi

echo "Success! Image saved to $OUTPUT_FILE."
echo "Transfer $OUTPUT_FILE, docker-compose.yml, and .env to your offline server."
