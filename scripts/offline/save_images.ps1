# Configuration
$ImageName = "aura"
$ImageTag = "latest"
$OutputFile = "aura-offline.tar"

# Ensure we are in the project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

Write-Host "Project Root: $ProjectRoot"
Set-Location $ProjectRoot

# Build the image
Write-Host "Building Docker image: ${ImageName}:${ImageTag}..."
docker build -t "${ImageName}:${ImageTag}" .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Docker build failed."
    exit 1
}

# Save the image
Write-Host "Saving image to $OutputFile..."
docker save -o "$OutputFile" "${ImageName}:${ImageTag}"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Failed to save image."
    exit 1
}

Write-Host "Success! Image saved to $OutputFile."
Write-Host "Transfer $OutputFile, docker-compose.yml, and .env to your offline server."
