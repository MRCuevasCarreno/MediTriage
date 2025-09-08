# MediTriage - Run Frontend (Vite)
# Usage: .\run-front.ps1

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = "MediTriage Frontend - Vite"

# Go to Frontend folder
Set-Location "C:\Users\raulb\Escritorio\CAPSTONE\MediTriage\APT\Frontend"

# Ensure .env.local exists (defaults to API on http://localhost:5000)
if (-not (Test-Path ".\env.local")) {
  'VITE_API_URL=http://localhost:5000' | Out-File -FilePath .env.local -Encoding utf8
  Write-Host ".env.local created with VITE_API_URL=http://localhost:5000"
}

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not in PATH. Install from https://nodejs.org/"
  exit 1
}

# Install deps
npm install

# Ensure Vite est present (scripts use 'vite')
if (-not (Test-Path ".\node_modules\.bin\vite.cmd")) {
  Write-Host "Installing vite as devDependency..."
  npm install -D vite
}

# Run dev server
npm run dev
