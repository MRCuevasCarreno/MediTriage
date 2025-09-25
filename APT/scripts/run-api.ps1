# run-api.ps1
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$proj = Join-Path $root "Backend\MediTriage.Api.csproj"

if (-not (Test-Path $proj)) {
  throw "No encuentro el proyecto en: $proj"
}

Write-Host "API -> $proj"
$env:ASPNETCORE_ENVIRONMENT = "Development"

dotnet restore "$proj"

# Asegura dotnet-ef (si falta)
try { dotnet ef --version | Out-Null } catch { dotnet tool install --global dotnet-ef }

dotnet ef database update --project "$proj" --startup-project "$proj"

# 👇 Fuerza el mismo puerto que usaste manualmente
dotnet run --project "$proj" -- --urls "http://localhost:5000"
