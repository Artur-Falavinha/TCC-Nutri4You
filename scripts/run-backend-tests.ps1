$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\resolve-java-home.ps1" | Out-Null

Push-Location (Join-Path $scriptDir "..\backend")
try {
    & .\mvnw.cmd -B test @args
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
