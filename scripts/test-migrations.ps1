param(
    [string]$Image = 'postgres:16'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$migrations = Join-Path $repo 'backend/src/main/resources/db/migration'
$v1 = Get-Content (Join-Path $migrations 'V1__schema_inicial.sql') -Raw
$compatibility = Get-Content (Join-Path $migrations 'V1_1__compatibilidade_autenticacao.sql') -Raw
$v2 = Get-Content (Join-Path $migrations 'V2__anamnese_unica.sql') -Raw
$v3 = Get-Content (Join-Path $migrations 'V3__anamnese_fuso_horario.sql') -Raw
$v4 = Get-Content (Join-Path $migrations 'V4__token_email_titular.sql') -Raw
$init = Get-Content (Join-Path $repo 'database/init.sql') -Raw

# Every scenario uses a new schema inside a transaction, rolled back even on
# failure when psql disconnects. No application tables or Flyway history change.
$assertions = @'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM Anamnese
        WHERE atualizada_em IS DISTINCT FROM TIMESTAMPTZ '2026-09-25 15:30:00+00'
           OR (id_paciente = 1 AND finalizada_em IS DISTINCT FROM TIMESTAMPTZ '2026-09-25 15:30:00+00')
           OR (id_paciente = 2 AND finalizada_em IS NOT NULL)
    ) THEN
        RAISE EXCEPTION 'Migration changed an instant or a null timestamp';
    END IF;
    IF (SELECT count(*) FROM pg_attribute
        WHERE attrelid = 'Anamnese'::regclass
          AND attname IN ('finalizada_em', 'atualizada_em')
          AND atttypid = 'timestamp with time zone'::regtype) <> 2 THEN
        RAISE EXCEPTION 'Both columns must be TIMESTAMPTZ';
    END IF;
END;
$$;

-- Both supported token owners must work, including nullable patient IDs.
INSERT INTO Token_Email (token, tipo, id_paciente, expira_em)
VALUES (gen_random_uuid(), 'CONFIRMACAO_EMAIL', 1, CURRENT_TIMESTAMP);
INSERT INTO Token_Email (token, tipo, id_nutricionista, expira_em)
VALUES (gen_random_uuid(), 'RECUPERACAO_SENHA', 1, CURRENT_TIMESTAMP);

DO $$
BEGIN
    BEGIN
        INSERT INTO Token_Email (token, tipo, expira_em)
        VALUES (gen_random_uuid(), 'RECUPERACAO_SENHA', CURRENT_TIMESTAMP);
        RAISE EXCEPTION 'Ownerless token was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO Token_Email (token, tipo, id_paciente, id_nutricionista, expira_em)
        VALUES (gen_random_uuid(), 'RECUPERACAO_SENHA', 1, 1, CURRENT_TIMESTAMP);
        RAISE EXCEPTION 'Token with two owners was accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO Token_Email (token, tipo, id_nutricionista, expira_em)
        VALUES (gen_random_uuid(), 'RECUPERACAO_SENHA', 2147483647, CURRENT_TIMESTAMP);
        RAISE EXCEPTION 'Token with nonexistent nutritionist was accepted';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
END;
$$;
'@

$container = 'nutri4you-migrations-' + [Guid]::NewGuid().ToString('N')
docker run --rm -d --name $container --network none -e POSTGRES_PASSWORD=migration-test-only $Image | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not start isolated PostgreSQL container' }
try {
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        docker exec $container pg_isready -h 127.0.0.1 -U postgres *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw 'Isolated PostgreSQL did not become ready' }

    foreach ($timezone in @('UTC', 'America/Sao_Paulo')) {
        foreach ($scenario in @('fresh', 'legacy-missing-token', 'initialized', 'mixed-types')) {
            $schema = 'migration_test_' + [Guid]::NewGuid().ToString('N')
            $base = if ($scenario -eq 'initialized') { $init } else { $v1 }
            $legacy = if ($scenario -eq 'legacy-missing-token') { 'DROP TABLE Token_Email;' } else { '' }
            $mixed = if ($scenario -eq 'mixed-types') {
                "ALTER TABLE Anamnese ALTER COLUMN finalizada_em TYPE TIMESTAMPTZ USING finalizada_em AT TIME ZONE 'UTC';"
            } else { '' }
            # Explicit +00 is honored by TIMESTAMPTZ and ignored by naive timestamps;
            # both represent the same UTC wall-clock value expected by legacy V3.
            $sql = @"
BEGIN;
CREATE SCHEMA $schema;
SET LOCAL search_path TO $schema;
SET LOCAL TIME ZONE '$timezone';
$base
$legacy
$compatibility
$v2
$mixed
INSERT INTO Anamnese (id_paciente, id_nutricionista, finalizada_em, atualizada_em)
VALUES (1, 1, '2026-09-25 15:30:00+00', '2026-09-25 15:30:00+00'),
       (2, 1, NULL, '2026-09-25 15:30:00+00');
$v3
$v3
$v4
$v4
$assertions
ROLLBACK;
"@
            $sql | docker exec -i $container psql -X -q -v ON_ERROR_STOP=1 -U postgres -d postgres
            if ($LASTEXITCODE -ne 0) { throw "Failed: $scenario / $timezone" }
            Write-Host "PASS: $scenario / $timezone"
        }
    }
} finally {
    # Only the container created above is stopped; --rm removes its test data.
    docker stop $container | Out-Null
}
