# run-front.ps1
# Uso: powershell -ExecutionPolicy Bypass -File .\run-front.ps1
$ErrorActionPreference = "Stop"

# Ir a la carpeta donde está el script
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Si el script NO está dentro de Frontend, intenta moverse ahí
if (-not (Test-Path ".\package.json")) {
    if (Test-Path ".\Frontend\package.json") {
        Set-Location .\Frontend
    } elseif (Test-Path "..\Frontend\package.json") {
        Set-Location ..\Frontend
    }
}

if (-not (Test-Path ".\package.json")) {
    Write-Error "No se encontró package.json. Asegúrate de estar en la carpeta Frontend."
}

# Verifica Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js no está instalado o no está en PATH. Instálalo desde https://nodejs.org/"
}

# Crea .env.local si no existe (apunta al backend HTTP para evitar SSL en dev)
$envPath = ".\.env.local"
if (-not (Test-Path $envPath)) {
@"
VITE_API_URL=http://localhost:5290/api
"@ | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "Creado .env.local con VITE_API_URL=http://localhost:5290/api"
} else {
    Write-Host ".env.local ya existe. (Usando su configuración)"
}

# Instala dependencias si faltan
if (-not (Test-Path ".\node_modules")) {
    Write-Host "Instalando dependencias npm..."
    npm install
}

# Puerto configurable (por variable de entorno PORT) o 5173 por defecto
$port = if ($env:PORT) { $env:PORT } else { 5173 }

Write-Host "Iniciando Vite en http://localhost:$port ..."
# --host para permitir acceso desde otras máquinas de la red si lo necesitas
npm run dev -- --port $port --host
