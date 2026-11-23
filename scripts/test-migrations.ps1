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
$v5 = Get-Content (Join-Path $migrations 'V5__remover_medidas_da_anamnese.sql') -Raw
$v6 = Get-Content (Join-Path $migrations 'V6__ciclo_plano_alimentar.sql') -Raw
$v7 = Get-Content (Join-Path $migrations 'V7__registro_consultas.sql') -Raw
$v8 = Get-Content (Join-Path $migrations 'V8__macronutrientes_consumo_diario.sql') -Raw
$v9 = Get-Content (Join-Path $migrations 'V9__catalogo_taco.sql') -Raw
$v10 = Get-Content (Join-Path $migrations 'V10__prescricao_alimentar.sql') -Raw
$v11 = Get-Content (Join-Path $migrations 'V11__fibras_e_substitutos_prescritos.sql') -Raw
$v12 = Get-Content (Join-Path $migrations 'V12__horarios_atendimento.sql') -Raw
$v13 = Get-Content (Join-Path $migrations 'V13__inicio_consulta.sql') -Raw
$v14 = Get-Content (Join-Path $migrations 'V14__refeicoes_semanais.sql') -Raw
$v16 = Get-Content (Join-Path $migrations 'V16__consumo_por_refeicao.sql') -Raw
$v15 = Get-Content (Join-Path $migrations 'V15__exames_metadados_seguranca.sql') -Raw
$v17 = Get-Content (Join-Path $migrations 'V17__consultas_avulsas.sql') -Raw
$v18 = Get-Content (Join-Path $migrations 'V18__exames_por_atendimento.sql') -Raw
$v19 = Get-Content (Join-Path $migrations 'V19__aceite_de_vinculo_clinico.sql') -Raw
$v20 = Get-Content (Join-Path $migrations 'V20__jackson_pollock_sete_pregas.sql') -Raw
$v21 = Get-Content (Join-Path $migrations 'V21__percentuais_macronutrientes.sql') -Raw
$v22 = Get-Content (Join-Path $migrations 'V22__reativar_medidas_opcionais_anamnese.sql') -Raw
$v23 = Get-Content (Join-Path $migrations 'V23__solicitacao_de_vinculo_pelo_paciente.sql') -Raw
$v24 = Get-Content (Join-Path $migrations 'V24__termos_e_direitos_do_titular.sql') -Raw
$v25 = Get-Content (Join-Path $migrations 'V25__confirmacao_email_nutricionista.sql') -Raw
$v26 = Get-Content (Join-Path $migrations 'V26__cadastro_pendente.sql') -Raw
$v27 = Get-Content (Join-Path $migrations 'V27__unicidade_cpf_paciente.sql') -Raw
$v28 = Get-Content (Join-Path $migrations 'V28__exclusao_planos_alimentares.sql') -Raw
$v29 = Get-Content (Join-Path $migrations 'V29__vinculo_por_agendamento_e_nutricionista_demo.sql') -Raw
$v30 = Get-Content (Join-Path $migrations 'V30__remover_pedido_privacidade.sql') -Raw
$v31 = Get-Content (Join-Path $migrations 'V31__integridade_escopo_clinico_e_precisao_consumo.sql') -Raw
$init = Get-Content (Join-Path $repo 'database/init.sql') -Raw

$dadosLegadosCpfEPlano = @'
INSERT INTO Paciente (id_paciente, nome, email, senha, cpf) VALUES
    (900027, 'Paciente A', 'cpf-a@example.test', 'hash', '009.876.543-21'),
    (900028, 'Paciente B', 'cpf-b@example.test', 'hash', '00987654321');
INSERT INTO Consulta (id_consulta, id_paciente, id_nutricionista, data_hora)
VALUES (900027, 900028, 1, '2026-11-22 09:00');
INSERT INTO Plano_Alimentar (id_plano, id_paciente, id_nutricionista, id_consulta, status)
VALUES (900027, 900028, 1, 900027, 'PUBLICADO');
INSERT INTO Refeicao (id_refeicao, id_plano, nome, horario)
VALUES (900027, 900027, 'Almoço', '12:00');
INSERT INTO Consumo_Refeicao (id_paciente, id_refeicao, data_registro, consumida)
VALUES (900028, 900027, '2026-11-22', TRUE);
'@

$assertionsCpfEPlano = @'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Paciente WHERE id_paciente = 900027
        AND cpf = '00987654321' AND cpf_original_conflitante = '009.876.543-21')
       OR NOT EXISTS (SELECT 1 FROM Paciente WHERE id_paciente = 900028
        AND cpf IS NULL AND cpf_original_conflitante = '00987654321') THEN
        RAISE EXCEPTION 'V27 must reserve the normalized CPF and preserve both legacy values';
    END IF;
    BEGIN
        INSERT INTO Paciente (nome, email, senha, cpf)
        VALUES ('Duplicado', 'cpf-duplicado@example.test', 'hash', '00987654321');
        RAISE EXCEPTION 'V27 accepted a duplicate CPF';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO Plano_Alimentar (id_paciente, id_nutricionista, id_consulta)
        VALUES (900028, 1, 900027);
        RAISE EXCEPTION 'V28 accepted two visible plans for one appointment';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    UPDATE Plano_Alimentar SET status = 'EXCLUIDO' WHERE id_plano = 900027;
    INSERT INTO Plano_Alimentar (id_paciente, id_nutricionista, id_consulta)
    VALUES (900028, 1, 900027);
    IF NOT EXISTS (SELECT 1 FROM Consumo_Refeicao WHERE id_refeicao = 900027 AND consumida) THEN
        RAISE EXCEPTION 'V28 did not preserve consumption after plan removal';
    END IF;
END;
$$;
'@

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
        foreach ($scenario in @('fresh', 'legacy-missing-token', 'initialized', 'mixed-types', 'upgrade-v10')) {
            $schema = 'migration_test_' + [Guid]::NewGuid().ToString('N')
            $base = if ($scenario -eq 'initialized') { $init } else { $v1 }
            $legacy = if ($scenario -eq 'legacy-missing-token') { 'DROP TABLE Token_Email;' } else { '' }
            $mixed = if ($scenario -eq 'mixed-types') {
                "ALTER TABLE Anamnese ALTER COLUMN finalizada_em TYPE TIMESTAMPTZ USING finalizada_em AT TIME ZONE 'UTC';"
            } else { '' }
            $upgradeBefore = if ($scenario -eq 'upgrade-v10') { @'
INSERT INTO Plano_Alimentar (id_plano, id_paciente, id_nutricionista, titulo)
VALUES (900001, 1, 1, 'Plano anterior à V11');
INSERT INTO Refeicao (id_refeicao, id_plano, nome, horario)
VALUES (900001, 900001, 'Refeição anterior à V11', '12:00');
INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g)
SELECT 900001, id_alimento, 42.50, 42.123456, proteina_100g, carboidratos_100g, gordura_100g
FROM Alimento WHERE codigo_taco = 3;
CREATE TEMP TABLE snapshot_v10 AS SELECT * FROM Item_Refeicao;
'@ } else { '' }
            $upgradeAfter = if ($scenario -eq 'upgrade-v10') { @'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM snapshot_v10 antigo JOIN Item_Refeicao atual USING (id_refeicao, id_alimento)
        WHERE antigo.quantidade_gramas IS DISTINCT FROM atual.quantidade_gramas
           OR antigo.kcal_100g IS DISTINCT FROM atual.kcal_100g
           OR antigo.proteina_100g IS DISTINCT FROM atual.proteina_100g
           OR antigo.carboidratos_100g IS DISTINCT FROM atual.carboidratos_100g
           OR antigo.gordura_100g IS DISTINCT FROM atual.gordura_100g) THEN
        RAISE EXCEPTION 'V11 changed existing primary prescription snapshots';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Item_Refeicao WHERE id_refeicao = 900001 AND fibra_100g = 1.561000) THEN
        RAISE EXCEPTION 'V11 did not populate known fiber on existing items';
    END IF;
END;
$$;
INSERT INTO Substituto_Item_Refeicao (id_refeicao, id_alimento_principal, id_alimento_substituto,
    quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
SELECT 900001, principal.id_alimento, substituto.id_alimento, 50,
    substituto.kcal_100g, substituto.proteina_100g, substituto.carboidratos_100g, substituto.gordura_100g, substituto.fibra_100g
FROM Alimento principal CROSS JOIN Alimento substituto
WHERE principal.codigo_taco = 3 AND substituto.codigo_taco = 1;
DELETE FROM Item_Refeicao WHERE id_refeicao = 900001;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM Substituto_Item_Refeicao WHERE id_refeicao = 900001) THEN
        RAISE EXCEPTION 'V11 must cascade primary item deletion to alternatives';
    END IF;
END;
$$;
'@ } else { '' }
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
$v5
UPDATE Consulta SET observacao = 'Registro legado' WHERE id_consulta = 1;
$v7
$v6
$v8
$v9
$v10
DO `$`$
BEGIN
    IF (SELECT count(*) FROM Alimento WHERE catalogo_ativo) <> 597
       OR (SELECT count(DISTINCT categoria) FROM Alimento WHERE catalogo_ativo) <> 15
       OR (SELECT count(*) FROM Alimento WHERE catalogo_ativo AND disponivel_prescricao) <> 592 THEN
        RAISE EXCEPTION 'V9 must import the complete validated TACO catalog';
    END IF;
    IF (SELECT count(*) FROM Alimento WHERE codigo_taco IS NULL AND NOT catalogo_ativo) <> 5 THEN
        RAISE EXCEPTION 'V9 must preserve the five legacy food records';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 3
                   AND kcal_100g = 128.258486 AND proteina_100g = 2.520817
                   AND carboidratos_100g = 28.059850 AND gordura_100g = 0.227000) THEN
        RAISE EXCEPTION 'V9 changed the reference food composition';
    END IF;
    IF EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco IN (450, 457, 458, 591)
                AND (disponivel_prescricao OR kcal_100g IS NOT NULL)) THEN
        RAISE EXCEPTION 'V9 must not invent values under scientific reassessment';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 259
                   AND proteina_100g = 0 AND carboidratos_100g = 0
                   AND observacao_fonte LIKE '%NA%') THEN
        RAISE EXCEPTION 'V9 must retain non-applicable source qualifiers';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 288
                   AND carboidratos_100g = 0 AND observacao_fonte IS NOT NULL) THEN
        RAISE EXCEPTION 'V9 must record normalization of the source rounding residual';
    END IF;
    IF EXISTS (SELECT 1 FROM Item_Refeicao i JOIN Alimento a ON a.id_alimento = i.id_alimento
                WHERE i.kcal_100g IS DISTINCT FROM a.kcal_100g
                   OR i.proteina_100g IS DISTINCT FROM a.proteina_100g
                   OR i.carboidratos_100g IS DISTINCT FROM a.carboidratos_100g) THEN
        RAISE EXCEPTION 'V10 must preserve legacy food compositions in item snapshots';
    END IF;
END;
`$`$;
$upgradeBefore
$v11
$upgradeAfter
DO `$`$
BEGIN
    IF (SELECT count(*) FROM Alimento WHERE catalogo_ativo AND fibra_100g IS NULL) <> 14
       OR (SELECT count(*) FROM Alimento WHERE catalogo_ativo AND fibra_100g IS NOT NULL) <> 583 THEN
        RAISE EXCEPTION 'V11 must preserve missing and reassessed fiber values';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 3 AND fibra_100g = 1.561000)
       OR NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 1 AND fibra_100g = 2.749333) THEN
        RAISE EXCEPTION 'V11 changed the official fiber reference values';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 259 AND fibra_100g = 0
                   AND observacao_fonte LIKE '%Fibra alimentar: NA%')
       OR NOT EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco = 209 AND fibra_100g = 0
                   AND observacao_fonte LIKE '%Fibra alimentar: Tr%') THEN
        RAISE EXCEPTION 'V11 must retain non-applicable and trace fiber qualifiers';
    END IF;
    IF EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco IN (280, 330, 450, 537) AND fibra_100g IS NOT NULL)
       OR EXISTS (SELECT 1 FROM Alimento WHERE codigo_taco IS NULL AND fibra_100g IS NOT NULL) THEN
        RAISE EXCEPTION 'V11 must not manufacture unknown or legacy fiber';
    END IF;
END;
`$`$;
DO `$`$
BEGIN
    IF EXISTS (
        SELECT 1 FROM Plano_Alimentar p
        JOIN Consulta c ON c.id_consulta = p.id_consulta
        WHERE p.id_paciente IS DISTINCT FROM c.id_paciente
           OR p.id_nutricionista IS DISTINCT FROM c.id_nutricionista
           OR p.status <> 'RASCUNHO'
    ) THEN
        RAISE EXCEPTION 'V6 must preserve plan ownership when applied after V7';
    END IF;
    IF (SELECT count(*) FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'consumo_diario'
          AND column_name IN ('proteinas_consumidas', 'carboidratos_consumidos', 'gorduras_consumidas')) <> 3 THEN
        RAISE EXCEPTION 'V8 must add all daily macronutrients';
    END IF;
END;
`$`$;
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Consulta WHERE id_consulta = 1
                   AND observacao = 'Registro legado' AND versao = 0 AND atualizado_em IS NOT NULL) THEN
        RAISE EXCEPTION 'V7 must preserve existing consultations and initialize versions';
    END IF;
END;
`$`$;
UPDATE Consulta SET observacao = repeat('x', 5000) WHERE id_consulta = 1;
INSERT INTO Avaliacao_Antropometrica (id_paciente, id_consulta, data_avaliacao, peso, altura, imc)
VALUES (1, 1, '2025-01-15 14:30', 500, 0.30, 5555.56);
DO `$`$
BEGIN
    BEGIN
        INSERT INTO Avaliacao_Antropometrica (id_paciente, id_consulta, data_avaliacao)
        VALUES (1, 1, CURRENT_TIMESTAMP);
        RAISE EXCEPTION 'Duplicate assessment accepted for consultation';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
END;
`$`$;
$v12
$v13
$v14
$v15
$v16
$v17
$v18
$v19
$v20
$v21
$v22
$v23
$v24
$v25
$v26
$dadosLegadosCpfEPlano
$v27
$v28
$assertionsCpfEPlano
DO `$`$
BEGIN
    IF to_regclass('cadastro_pendente') IS NULL OR EXISTS (SELECT 1 FROM cadastro_pendente) THEN
        RAISE EXCEPTION 'V26 must create an empty table for email verification requests';
    END IF;
    IF EXISTS (SELECT 1 FROM Nutricionista WHERE NOT email_confirmado) THEN
        RAISE EXCEPTION 'V25 must preserve access for existing nutritionists';
    END IF;
END;
`$`$;
$v29
$v30
$v31
DO `$`$
BEGIN
    IF EXISTS (SELECT 1 FROM Relacao_Clinica WHERE solicitada_pelo_paciente) THEN
        RAISE EXCEPTION 'V23 changed the initiator of a legacy relation';
    END IF;
    IF to_regclass('aceite_termo') IS NULL OR to_regclass('pedido_privacidade') IS NOT NULL THEN
        RAISE EXCEPTION 'V30 must preserve term acceptance and remove internal privacy requests';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'consumo_diario'
          AND column_name = 'kcal_consumidas'
          AND numeric_precision = 8
          AND numeric_scale = 2
    ) THEN
        RAISE EXCEPTION 'V31 did not align daily calorie precision';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Nutricionista WHERE id_nutricionista = 1 AND aceita_consultas_avulsas = TRUE)
        OR NOT EXISTS (SELECT 1 FROM Nutricionista WHERE email = 'mariana@nutri4you.com' AND aceita_consultas_avulsas = TRUE)
        OR NOT EXISTS (SELECT 1 FROM Consulta WHERE id_consulta = 1 AND avulsa = FALSE) THEN
        RAISE EXCEPTION 'V17/V29 did not preserve appointment type or enable the demo catalog';
    END IF;
    IF EXISTS (SELECT 1 FROM Refeicao WHERE dia_semana IS NOT NULL) THEN
        RAISE EXCEPTION 'V14 changed the daily repetition of legacy meals';
    END IF;
    IF to_regclass('consumo_refeicao') IS NULL THEN
        RAISE EXCEPTION 'V16 did not create meal consumption history';
    END IF;
    IF EXISTS (
        SELECT 1 FROM Nutricionista n
        WHERE n.email <> 'mariana@nutri4you.com'
          AND (SELECT count(*) FROM Horario_Atendimento h
               WHERE h.id_nutricionista = n.id_nutricionista) <> 48
    ) OR (SELECT count(*) FROM Horario_Atendimento h
          JOIN Nutricionista n ON n.id_nutricionista = h.id_nutricionista
          WHERE n.email = 'mariana@nutri4you.com') <> 17 THEN
        RAISE EXCEPTION 'V12/V29 did not preserve or create the expected weekly schedules';
    END IF;
    IF EXISTS (SELECT 1 FROM Plano_Alimentar WHERE id_paciente IS NULL OR id_nutricionista IS NULL) THEN
        RAISE EXCEPTION 'V6 lost plan ownership';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM Consulta WHERE id_consulta = 1 AND iniciada_em IS NULL) THEN
        RAISE EXCEPTION 'V13 lost legacy consultation';
    END IF;
    IF (SELECT count(*) FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'avaliacao_antropometrica'
          AND column_name IN ('prega_peitoral', 'prega_axilar_media', 'prega_abdominal', 'prega_coxa',
                              'massa_magra_kg', 'massa_gorda_kg', 'metodo_percentual_gordura')) <> 7 THEN
        RAISE EXCEPTION 'V20 did not add all Jackson-Pollock and composition columns';
    END IF;
    IF (SELECT count(*) FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'plano_alimentar'
          AND column_name IN ('percentual_proteina', 'percentual_carboidratos', 'percentual_gordura')) <> 3 THEN
        RAISE EXCEPTION 'V21 did not add the macronutrient percentage columns';
    END IF;
    BEGIN
        INSERT INTO Horario_Atendimento (id_nutricionista, dia_semana, horario) VALUES (1, 8, '10:00');
        RAISE EXCEPTION 'Invalid weekday accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        UPDATE Avaliacao_Antropometrica
        SET id_paciente = 2
        WHERE id_consulta = 1;
        RAISE EXCEPTION 'Assessment accepted a patient different from its consultation';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO Exame (id_paciente, id_nutricionista, id_consulta, nome_exame)
        VALUES (2, 1, 1, 'Escopo divergente');
        RAISE EXCEPTION 'Exam accepted a patient different from its consultation';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO Plano_Alimentar (id_consulta, id_paciente, id_nutricionista)
        VALUES (1, 2, 1);
        RAISE EXCEPTION 'Plan accepted a patient different from its consultation';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
END;
`$`$;
INSERT INTO Exame (id_paciente, id_nutricionista, nome_exame, arquivo, arquivo_tipo, arquivo_tamanho)
VALUES (1, 1, 'Teste isolado', decode('255044462d', 'hex'), 'application/pdf', 5);
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Exame WHERE nome_exame = 'Teste isolado' AND octet_length(arquivo) = 5 AND versao = 0) THEN
        RAISE EXCEPTION 'V15 binary storage or version failed';
    END IF;
END;
`$`$;
INSERT INTO Nutricionista (nome, email, senha, crn)
VALUES ('Novo nutricionista', 'novo@example.test', 'hash', 'CRN8-10101');
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Nutricionista WHERE email = 'novo@example.test' AND NOT email_confirmado) THEN
        RAISE EXCEPTION 'V25 must require confirmation for newly inserted nutritionists';
    END IF;
END;
`$`$;
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
