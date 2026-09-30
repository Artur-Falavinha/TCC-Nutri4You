$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Get-Content -Raw (Join-Path $repo "database/dev-dashboard.sql") |
    docker exec -i nutri4you-db psql -v ON_ERROR_STOP=1 -U springuser -d nutri4you_db
if ($LASTEXITCODE -ne 0) { throw "Falha ao popular o dashboard." }
Write-Host "Dashboard de demonstração atualizado."
