# scripts/run-api.ps1
$ErrorActionPreference = 'Stop'
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ..\Backend

$env:ASPNETCORE_ENVIRONMENT = "Development"
# Si decides usar 5000/5001:
$env:ASPNETCORE_URLS = "http://localhost:5000;https://localhost:5001"

dotnet restore
dotnet ef database update
dotnet run
