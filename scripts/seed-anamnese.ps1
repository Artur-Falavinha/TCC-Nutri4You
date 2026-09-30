param([string]$ApiBase = "http://localhost:8080/api/v1")
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Get-Content -Raw (Join-Path $repo "database/dev-anamnese.sql") |
    docker exec -i nutri4you-db psql -v ON_ERROR_STOP=1 -U springuser -d nutri4you_db
if ($LASTEXITCODE -ne 0) { throw "Falha ao criar contas de teste." }

@'
DELETE FROM Resposta_Anamnese
WHERE id_paciente IN (
    SELECT id_paciente FROM Paciente
    WHERE email IN (
        'amanda.anamnese@nutri4you.test',
        'bruno.anamnese@nutri4you.test',
        'carla.anamnese@nutri4you.test'
    )
);
DELETE FROM Anamnese
WHERE id_paciente IN (
    SELECT id_paciente FROM Paciente
    WHERE email IN (
        'amanda.anamnese@nutri4you.test',
        'bruno.anamnese@nutri4you.test',
        'carla.anamnese@nutri4you.test'
    )
);
'@ | docker exec -i nutri4you-db psql -v ON_ERROR_STOP=1 -U springuser -d nutri4you_db
if ($LASTEXITCODE -ne 0) { throw "Falha ao limpar anamneses de teste." }

function Invoke-ApiJson {
    param(
        [string]$Url,
        [string]$Method = "Get",
        [hashtable]$Headers = @{},
        [string]$Json
    )
    $params = @{ Uri = $Url; Method = $Method; Headers = $Headers; UseBasicParsing = $true }
    if ($Json) {
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($Json)
        $params.ContentType = "application/json; charset=utf-8"
    }
    $response = Invoke-WebRequest @params
    $text = [System.Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
    if (-not $text) { return $null }
    return $text | ConvertFrom-Json
}

function ConvertTo-SeedJson([object]$Value) {
    if ($null -eq $Value) { return "null" }
    if ($Value -is [string]) {
        $text = $Value.Replace('\', '\\').Replace('"', '\"')
        return '"' + $text + '"'
    }
    if ($Value -is [bool]) { if ($Value) { return "true" } else { return "false" } }
    if ($Value -is [System.Collections.IList]) {
        $items = @($Value | ForEach-Object { ConvertTo-SeedJson $_ })
        return "[" + ($items -join ",") + "]"
    }
    if ($Value -is [hashtable]) {
        $pairs = @()
        foreach ($key in $Value.Keys) {
            $pairs += ((ConvertTo-SeedJson ([string]$key)) + ":" + (ConvertTo-SeedJson $Value[$key]))
        }
        return "{" + ($pairs -join ",") + "}"
    }
    $number = [System.Convert]::ToDecimal($Value, [cultureinfo]::InvariantCulture)
    return $number.ToString([cultureinfo]::InvariantCulture)
}

function Test-AnamneseVisible([object]$Field, [hashtable]$Responses, [object[]]$Catalog) {
    if (-not $Field.when) { return $true }
    $parent = $Catalog | Where-Object { $_.key -eq $Field.when.key } | Select-Object -First 1
    if (-not $parent -or -not (Test-AnamneseVisible $parent $Responses $Catalog)) { return $false }
    $answer = $Responses[$parent.key]
    if ($null -eq $answer) { return $false }
    $expected = @($Field.when.values)
    return [bool](@($answer) | Where-Object { $expected -contains $_ } | Select-Object -First 1)
}

function Get-AnamneseSeedValue([object]$Field) {
    switch ($Field.type) {
        "number" {
            if ($Field.key -eq "height") { return 1.68 }
            if ($Field.key -eq "weight") { return 72.5 }
            $min = [decimal]$Field.min
            $max = [decimal]$Field.max
            $candidate = [decimal]4
            if ($candidate -ge $min -and $candidate -le $max) { return 4 }
            return [double]$min
        }
        "range" { return 5 }
        "select" {
            $options = @($Field.options)
            $nao = $options | Where-Object { $_.Length -eq 3 -and $_.StartsWith("N") } | Select-Object -First 1
            if ($nao) { return $nao }
            return $options[0]
        }
        "checkbox" {
            if ($Field.exclusive) { return @($Field.exclusive) }
            return @($Field.options[0])
        }
        "tel" { return "(41) 99999-0003" }
        default {
            switch ($Field.key) {
                "profession" { return "Analista" }
                "foodPreferences" { return "Gosta de arroz, feijão e frutas. Evita frituras." }
                "typicalDay" { return "Café da manhã às 7h, almoço às 12h, lanche às 16h e jantar às 19h." }
                default { return "Sem observações adicionais (paciente fictício)." }
            }
        }
    }
}

$login = Invoke-ApiJson "$ApiBase/auth/login" -Method Post -Json (@{email="anamnese@nutri4you.test"; senha="NutriTeste@123"} | ConvertTo-Json)
$headers = @{Authorization = "Bearer " + $login.data.token}
$patients = @((Invoke-ApiJson "$ApiBase/gestao-pacientes" -Headers $headers).data)
$fields = @((Invoke-ApiJson "$ApiBase/gestao-pacientes/anamnese/campos" -Headers $headers).data)

foreach ($patient in $patients) {
    $path = "$ApiBase/gestao-pacientes/$($patient.id)/anamnese"
    $current = (Invoke-ApiJson $path -Headers $headers).data
    if ($current.status -ne "NAO_INICIADA") { continue }
    if ($patient.email -eq "bruno.anamnese@nutri4you.test") {
        $body = @{versao=$current.versao; respostas=@{profession="Professor"; height=1.78; weight=82.5; allergy="Sim"; allergyDetails="Amendoim"}}
        Invoke-ApiJson "$path/rascunho" -Method Put -Headers $headers -Json (ConvertTo-SeedJson $body) | Out-Null
    }
    if ($patient.email -eq "carla.anamnese@nutri4you.test") {
        $responses = @{}
        foreach ($field in $fields) {
            if (-not (Test-AnamneseVisible $field $responses $fields)) { continue }
            $value = Get-AnamneseSeedValue $field
            if ($field.type -eq "checkbox") { $responses[$field.key] = ,$value }
            else { $responses[$field.key] = $value }
        }
        $body = @{versao=$current.versao; respostas=$responses}
        Invoke-ApiJson $path -Method Put -Headers $headers -Json (ConvertTo-SeedJson $body) | Out-Null
    }
}

foreach ($patient in $patients) {
    $record = (Invoke-ApiJson "$ApiBase/gestao-pacientes/$($patient.id)/anamnese" -Headers $headers).data
    "{0}: {1}" -f $patient.email, $record.status
}
$patients | Select-Object nome, @{Name="url";Expression={"http://localhost:4200/pacientes/$($_.id)/anamnese"}}
