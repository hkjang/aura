# Configuration
$ImageFile = "aura-offline.tar"

# Check if image file exists
if (-not (Test-Path "$ImageFile")) {
    Write-Error "Error: $ImageFile not found."
    Write-Host "Please ensure the offline image file is in the same directory."
    exit 1
}

# Load the image
Write-Host "Loading Docker image from $ImageFile..."
docker load -i "$ImageFile"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Failed to load Docker image."
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Warning "Warning: .env file not found. Application might not start correctly."
}

# Start the application
Write-Host "Starting application..."

if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose up -d
}
else {
    docker compose up -d
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Application started successfully!"
}
else {
    Write-Error "Error: Failed to start application."
    exit 1
}
