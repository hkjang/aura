#!/bin/bash

# Configuration
IMAGE_FILE="aura-offline.tar"

# Check if image file exists
if [ ! -f "$IMAGE_FILE" ]; then
    echo "Error: $IMAGE_FILE not found."
    echo "Please ensure the offline image file is in the same directory."
    exit 1
fi

# Load the image
echo "Loading Docker image from $IMAGE_FILE..."
docker load -i "$IMAGE_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Failed to load Docker image."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Application might not start correctly."
fi

# Start the application
echo "Starting application..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

if [ $? -eq 0 ]; then
    echo "Application started successfully!"
else
    echo "Error: Failed to start application."
    exit 1
fi
