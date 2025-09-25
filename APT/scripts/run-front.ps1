# run-front.ps1 (mínimo: hace lo mismo que tú haces a mano)
$ErrorActionPreference = "Stop"

$root   = Split-Path -Parent $PSScriptRoot
$front  = Join-Path $root "Frontend"

Set-Location $front
Write-Host "FRONT -> $front"

# Instala dependencias si faltan (igual que tú harías)
if (-not (Test-Path "node_modules")) { npm install }

# Lanza Vite exactamente como con tu comando manual
npm run dev
