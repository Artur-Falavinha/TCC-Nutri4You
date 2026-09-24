param([string]$ApiBase = "http://localhost:8080/api/v1")
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Get-Content -Raw (Join-Path $repo "database/dev-anamnese.sql") |
    docker exec -i nutri4you-db psql -v ON_ERROR_STOP=1 -U springuser -d nutri4you_db
if ($LASTEXITCODE -ne 0) { throw "Falha ao criar contas de teste." }

$login = Invoke-RestMethod "$ApiBase/auth/login" -Method Post -ContentType "application/json" -Body (
    @{email="anamnese@nutri4you.test"; senha="NutriTeste@123"} | ConvertTo-Json)
$headers = @{Authorization = "Bearer " + $login.data.token}
$patients = (Invoke-RestMethod "$ApiBase/gestao-pacientes" -Headers $headers).data
$fields = (Invoke-RestMethod "$ApiBase/gestao-pacientes/anamnese/campos" -Headers $headers).data

foreach ($patient in $patients) {
    $path = "$ApiBase/gestao-pacientes/$($patient.id)/anamnese"
    $current = (Invoke-RestMethod $path -Headers $headers).data
    if ($current.status -ne "NAO_INICIADA") { continue }
    if ($patient.email -eq "bruno.anamnese@nutri4you.test") {
        $body = @{versao=$current.versao; respostas=@{profession="Professor"; height=1.78; weight=82.5; allergy="Sim"; allergyDetails="Amendoim"}}
        Invoke-RestMethod "$path/rascunho" -Method Put -Headers $headers -ContentType "application/json; charset=utf-8" -Body ($body | ConvertTo-Json -Depth 10) | Out-Null
    }
    if ($patient.email -eq "carla.anamnese@nutri4you.test") {
        $responses = @{}
        foreach ($field in $fields) {
            if ($field.when) { continue }
            $responses[$field.key] = switch ($field.type) {
                "number" { 4 }
                "range" { 5 }
                "select" { if ($field.options -contains "Não") { "Não" } else { $field.options[0] } }
                "checkbox" { ,@($field.options[0]) }
                "tel" { "(41) 99999-0003" }
                default { "Sem observações adicionais (paciente fictício)." }
            }
        }
        $responses.height = 1.68
        $responses.weight = 72.5
        $responses.profession = "Analista"
        $responses.foodPreferences = "Gosta de arroz, feijão e frutas. Evita frituras."
        $responses.typicalDay = "Café da manhã às 7h, almoço às 12h, lanche às 16h e jantar às 19h."
        $responses.diet = "Não sigo dieta específica"
        $responses.deadline = "Não tenho prazo"
        $body = @{versao=$current.versao; respostas=$responses}
        Invoke-RestMethod $path -Method Put -Headers $headers -ContentType "application/json; charset=utf-8" -Body ($body | ConvertTo-Json -Depth 10) | Out-Null
    }
}
$patients | Select-Object nome, @{Name="url";Expression={"http://localhost:4200/pacientes/$($_.id)/anamnese"}}
