# MediTriage - Run API (Swagger)
# Usage: .\run-api.ps1

$ErrorActionPreference = 'Stop'

$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ConnectionStrings__Default = "Server=localhost\SQLEXPRESS;Database=MediTriageDb;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;"
$env:ASPNETCORE_URLS = "http://localhost:5000;https://localhost:5001"

Set-Location "C:\Users\raulb\Escritorio\CAPSTONE\MediTriage\APT\MediTriage.Api\MediTriage.Api"
dotnet restore
dotnet run
