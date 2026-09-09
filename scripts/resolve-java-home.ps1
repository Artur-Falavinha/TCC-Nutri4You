# Resolve JAVA_HOME for JDK 21 (Eclipse Temurin) on Windows.
# Usage: . .\scripts\resolve-java-home.ps1

function Resolve-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        return $env:JAVA_HOME
    }

    $adoptiumRoot = "C:\Program Files\Eclipse Adoptium"
    if (Test-Path $adoptiumRoot) {
        $jdk = Get-ChildItem $adoptiumRoot -Directory -Filter "jdk-21*" |
            Sort-Object Name -Descending |
            Select-Object -First 1

        if ($jdk -and (Test-Path "$($jdk.FullName)\bin\java.exe")) {
            return $jdk.FullName
        }
    }

    throw "JDK 21 não encontrado. Instale com: winget install EclipseAdoptium.Temurin.21.JDK"
}

$resolved = Resolve-JavaHome
$env:JAVA_HOME = $resolved

if ($env:Path -notlike "*$resolved\bin*") {
    $env:Path = "$resolved\bin;$env:Path"
}

Write-Output "JAVA_HOME=$resolved"
