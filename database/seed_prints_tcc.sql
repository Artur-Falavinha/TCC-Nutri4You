-- =============================================================================
-- SEED COMPLETO PARA PRINTS DO TCC (Nutri4You - Web e Mobile)
-- Popula para todos os pacientes cadastrados (incluindo arthur@email.com):
--   1. Evolução / Resultados: 4 avaliações antropométricas cronológicas com
--      todas as circunferências, composição corporal e 7 pregas de Jackson-Pollock
--   2. Dieta Ativa (PUBLICADO) + Rascunho (RASCUNHO) com metas em % e gramas,
--      4 refeições diárias, alimentos da TACO e substitutos equivalentes
--   3. Lista de Compras (7, 15 e 30 dias) com itens marcados como comprados/pendentes
--   4. Tela Inicial (Home): refeições do dia parcialmente concluídas, hidratação
--      em 1.750 / 2.500 ml e próxima consulta confirmada + solicitação pendente
--   5. Exames (Analisado, Enviado e Pendente) e Anamnese finalizada
-- =============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- Garante que o e-mail do nutricionista principal esteja limpo
UPDATE Nutricionista
SET email = 'nutri@nutri4you.com',
    email_confirmado = TRUE
WHERE id_nutricionista = 1;

-- Garante que todos os nutricionistas e pacientes tenham aceite dos termos de uso (V24)
INSERT INTO aceite_termo (tipo, titular_id, versao, aceito_em)
SELECT 'NUTRICIONISTA', id_nutricionista, '2026-11-22', CURRENT_TIMESTAMP
FROM Nutricionista
ON CONFLICT (tipo, titular_id, versao) DO NOTHING;

INSERT INTO aceite_termo (tipo, titular_id, versao, aceito_em)
SELECT 'PACIENTE', id_paciente, '2026-11-22', CURRENT_TIMESTAMP
FROM Paciente
ON CONFLICT (tipo, titular_id, versao) DO NOTHING;

DO $$
DECLARE
    v_nutri_id INT := 1;
    v_pac RECORD;
    v_c1 INT;
    v_c2 INT;
    v_c3 INT;
    v_c4 INT;
    v_plano_pub INT;
    v_plano_rasc INT;
    v_ref_cafe INT;
    v_ref_almoco INT;
    v_ref_lanche INT;
    v_ref_jantar INT;
    v_ref_rasc_cafe INT;
    v_ref_rasc_almoco INT;
    v_lista_id INT;
    v_dias INT;
    v_pdf_bytes BYTEA := E'\\x255044462d312e340a25e2e3cfd30a312030206f626a0a3c3c2f547970652f436174616c6f672f50616765732032203020523e3e0a656e646f626a0a322030206f626a0a3c3c2f547970652f50616765732f436f756e7420312f4b6964735b33203020525d3e3e0a656e646f626a0a332030206f626a0a3c3c2f547970652f506167652f506172656e742032203020522f4d65646961426f785b30203020363132203739325d3e3e0a656e646f626a0a747261696c65720a3c3c2f526f6f742031203020523e3e0a2525454f46';
BEGIN
    SELECT id_nutricionista INTO v_nutri_id FROM Nutricionista ORDER BY id_nutricionista LIMIT 1;

    FOR v_pac IN SELECT id_paciente, nome, email FROM Paciente ORDER BY id_paciente LOOP
        -- 1. Vínculo clínico ativo com o nutricionista
        INSERT INTO Relacao_Clinica (id_paciente, id_nutricionista, status)
        VALUES (v_pac.id_paciente, v_nutri_id, 'ATIVA')
        ON CONFLICT (id_paciente, id_nutricionista) DO UPDATE SET status = 'ATIVA';

        -- Limpa dados anteriores do paciente para reinserir o cenário completo e limpo
        DELETE FROM Consumo_Refeicao WHERE id_paciente = v_pac.id_paciente;
        DELETE FROM Consumo_Diario WHERE id_paciente = v_pac.id_paciente;
        DELETE FROM Item_Lista_Compras WHERE id_lista IN (
            SELECT id_lista FROM Lista_Compras WHERE id_plano IN (
                SELECT id_plano FROM Plano_Alimentar WHERE id_paciente = v_pac.id_paciente
            )
        );
        DELETE FROM Lista_Compras WHERE id_plano IN (
            SELECT id_plano FROM Plano_Alimentar WHERE id_paciente = v_pac.id_paciente
        );
        DELETE FROM Substituto_Item_Refeicao WHERE id_refeicao IN (
            SELECT id_refeicao FROM Refeicao WHERE id_plano IN (
                SELECT id_plano FROM Plano_Alimentar WHERE id_paciente = v_pac.id_paciente
            )
        );
        DELETE FROM Item_Refeicao WHERE id_refeicao IN (
            SELECT id_refeicao FROM Refeicao WHERE id_plano IN (
                SELECT id_plano FROM Plano_Alimentar WHERE id_paciente = v_pac.id_paciente
            )
        );
        DELETE FROM Refeicao WHERE id_plano IN (
            SELECT id_plano FROM Plano_Alimentar WHERE id_paciente = v_pac.id_paciente
        );
        DELETE FROM Plano_Alimentar WHERE id_paciente = v_pac.id_paciente;
        DELETE FROM Avaliacao_Antropometrica WHERE id_paciente = v_pac.id_paciente;
        DELETE FROM Exame WHERE id_paciente = v_pac.id_paciente;
        DELETE FROM Consulta WHERE id_paciente = v_pac.id_paciente;

        -- 2. Consultas realizadas (histórico longitudinal)
        INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa, observacao)
        VALUES (
            v_pac.id_paciente, v_nutri_id,
            (CURRENT_DATE - INTERVAL '90 days') + TIME '09:00:00',
            'REALIZADA', FALSE,
            'Consulta inicial: definição de estratégia de recomposição corporal, ajuste de fracionamento de refeições e meta hídrica.'
        ) RETURNING id_consulta INTO v_c1;

        INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa, observacao)
        VALUES (
            v_pac.id_paciente, v_nutri_id,
            (CURRENT_DATE - INTERVAL '60 days') + TIME '09:00:00',
            'REALIZADA', FALSE,
            'Primeiro retorno: excelente adesão ao plano alimentar, redução inicial de medidas abdominais e melhora na disposição.'
        ) RETURNING id_consulta INTO v_c2;

        INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa, observacao)
        VALUES (
            v_pac.id_paciente, v_nutri_id,
            (CURRENT_DATE - INTERVAL '30 days') + TIME '10:00:00',
            'REALIZADA', FALSE,
            'Segundo retorno: evolução consistente na redução do percentual de gordura com ganho de massa muscular.'
        ) RETURNING id_consulta INTO v_c3;

        INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa, observacao)
        VALUES (
            v_pac.id_paciente, v_nutri_id,
            (CURRENT_DATE - INTERVAL '3 days') + TIME '10:30:00',
            'REALIZADA', FALSE,
            'Terceiro retorno: consolidação das metas antropométricas e atualização do plano alimentar vigente.'
        ) RETURNING id_consulta INTO v_c4;

        -- Consultas futuras (Próxima Consulta Confirmada + Solicitação Pendente)
        INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa)
        VALUES (
            v_pac.id_paciente, v_nutri_id,
            (CURRENT_DATE + INTERVAL '4 days') + TIME '14:30:00',
            'CONFIRMADA', FALSE
        );

        INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa)
        VALUES (
            v_pac.id_paciente, v_nutri_id,
            (CURRENT_DATE + INTERVAL '11 days') + (TIME '15:00:00' + (v_pac.id_paciente * INTERVAL '30 minutes')),
            'AGUARDANDO_CONFIRMACAO', FALSE
        );

        -- Para o paciente 1 (Arthur), adiciona também uma consulta confirmada no dia de hoje à noite
        IF v_pac.id_paciente = 1 THEN
            INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status, avulsa)
            VALUES (
                v_pac.id_paciente, v_nutri_id,
                CURRENT_DATE + TIME '18:30:00',
                'CONFIRMADA', FALSE
            );
        END IF;

        -- 3. Quatro Avaliações Antropométricas completas (Evolução / Resultados)
        INSERT INTO Avaliacao_Antropometrica (
            id_paciente, id_consulta, data_avaliacao,
            peso, altura, imc,
            percentual_gordura, massa_magra_kg, massa_gorda_kg, massa_muscular_kg,
            metodo_percentual_gordura,
            prega_peitoral, prega_axilar_media, prega_tricipital, prega_subescapular,
            prega_abdominal, prega_suprailiaca, prega_coxa, prega_bicipital,
            circunferencia_cintura, circunferencia_quadril, circunferencia_braco
        ) VALUES
        (
            v_pac.id_paciente, v_c1, (CURRENT_DATE - INTERVAL '90 days') + TIME '09:15:00',
            79.40, 1.75, 25.93,
            20.80, 62.88, 16.52, 31.20,
            'Jackson-Pollock (7 pregas)',
            12.50, 13.00, 12.00, 15.50,
            22.00, 17.50, 18.00, 7.50,
            87.50, 103.00, 33.50
        ),
        (
            v_pac.id_paciente, v_c2, (CURRENT_DATE - INTERVAL '60 days') + TIME '09:15:00',
            77.10, 1.75, 25.18,
            19.10, 62.37, 14.73, 31.80,
            'Jackson-Pollock (7 pregas)',
            11.20, 11.80, 11.00, 14.20,
            19.80, 15.80, 16.70, 6.80,
            85.00, 102.00, 34.00
        ),
        (
            v_pac.id_paciente, v_c3, (CURRENT_DATE - INTERVAL '30 days') + TIME '10:15:00',
            75.20, 1.75, 24.56,
            17.40, 62.12, 13.08, 32.40,
            'Jackson-Pollock (7 pregas)',
            10.00, 10.50, 10.20, 13.00,
            17.50, 14.20, 15.40, 6.20,
            82.80, 101.00, 34.40
        ),
        (
            v_pac.id_paciente, v_c4, (CURRENT_DATE - INTERVAL '3 days') + TIME '10:45:00',
            73.60, 1.75, 24.03,
            15.80, 61.97, 11.63, 33.10,
            'Jackson-Pollock (7 pregas)',
            8.80, 9.40, 9.20, 11.80,
            15.20, 12.60, 14.00, 5.60,
            80.50, 100.00, 35.00
        );

        -- 4. Plano Alimentar PUBLICADO (vigente hoje)
        INSERT INTO Plano_Alimentar (
            id_paciente, id_nutricionista, id_consulta,
            titulo, orientacoes, status,
            vigencia_inicio, vigencia_fim, publicado_em,
            vet_meta_kcal,
            percentual_carboidratos, percentual_proteina, percentual_gordura,
            meta_carboidratos, meta_proteina, meta_gordura,
            versao
        ) VALUES (
            v_pac.id_paciente, v_nutri_id, v_c4,
            'Plano de Recomposição Corporal e Definição',
            'Manter ingestão hídrica de 2,5 L de água distribuída ao longo do dia. Priorizar preparações grelhadas ou assadas e utilizar a lista de substitutos equivalentes sempre que desejar variar os alimentos das refeições.',
            'PUBLICADO',
            CURRENT_DATE - INTERVAL '10 days',
            CURRENT_DATE + INTERVAL '20 days',
            CURRENT_TIMESTAMP - INTERVAL '3 days',
            2000.00,
            45.00, 30.00, 25.00,
            225.00, 150.00, 55.56,
            1
        ) RETURNING id_plano INTO v_plano_pub;

        -- Refeição 1: Café da manhã (07:30)
        INSERT INTO Refeicao (id_plano, nome, horario, dia_semana)
        VALUES (v_plano_pub, 'Café da manhã', '07:30:00', NULL)
        RETURNING id_refeicao INTO v_ref_cafe;

        INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_cafe, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1052, 50.00::DECIMAL(8,2)),  -- Pão, trigo, forma, integral
            (1488, 100.00::DECIMAL(8,2)), -- Ovo, de galinha, inteiro, cozido
            (1226, 150.00::DECIMAL(8,2)), -- Mamão, Papaia, cru
            (1007, 25.00::DECIMAL(8,2))   -- Aveia, flocos, crua
        ) AS v(id_alimento, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_alimento;

        INSERT INTO Substituto_Item_Refeicao (id_refeicao, id_alimento_principal, id_alimento_substituto, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_cafe, v.id_princ, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1052, 1551, 40.00::DECIMAL(8,2)), -- Tapioca no lugar do Pão integral
            (1488, 1461, 60.00::DECIMAL(8,2)), -- Queijo minas frescal no lugar do Ovo
            (1226, 1182, 70.00::DECIMAL(8,2))  -- Banana prata no lugar do Mamão
        ) AS v(id_princ, id_sub, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_sub;

        -- Refeição 2: Almoço (12:30)
        INSERT INTO Refeicao (id_plano, nome, horario, dia_semana)
        VALUES (v_plano_pub, 'Almoço', '12:30:00', NULL)
        RETURNING id_refeicao INTO v_ref_almoco;

        INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_almoco, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1001, 150.00::DECIMAL(8,2)), -- Arroz, integral, cozido
            (1561, 110.00::DECIMAL(8,2)), -- Feijão, carioca, cozido
            (1410, 160.00::DECIMAL(8,2)), -- Frango, peito, sem pele, grelhado
            (1078, 60.00::DECIMAL(8,2)),  -- Alface, crespa, crua
            (1157, 80.00::DECIMAL(8,2)),  -- Tomate, com semente, cru
            (1260, 8.00::DECIMAL(8,2))    -- Azeite, de oliva, extra virgem
        ) AS v(id_alimento, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_alimento;

        INSERT INTO Substituto_Item_Refeicao (id_refeicao, id_alimento_principal, id_alimento_substituto, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_almoco, v.id_princ, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1001, 1088, 220.00::DECIMAL(8,2)), -- Batata doce cozida no lugar do Arroz integral
            (1561, 1577, 100.00::DECIMAL(8,2)), -- Lentilha cozida no lugar do Feijão
            (1410, 1377, 140.00::DECIMAL(8,2))  -- Patinho bovino grelhado no lugar do Frango
        ) AS v(id_princ, id_sub, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_sub;

        -- Refeição 3: Lanche da tarde (16:00)
        INSERT INTO Refeicao (id_plano, nome, horario, dia_semana)
        VALUES (v_plano_pub, 'Lanche da tarde', '16:00:00', NULL)
        RETURNING id_refeicao INTO v_ref_lanche;

        INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_lanche, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1448, 170.00::DECIMAL(8,2)), -- Iogurte, natural
            (1182, 100.00::DECIMAL(8,2)), -- Banana, prata, crua
            (1007, 25.00::DECIMAL(8,2))   -- Aveia, flocos, crua
        ) AS v(id_alimento, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_alimento;

        INSERT INTO Substituto_Item_Refeicao (id_refeicao, id_alimento_principal, id_alimento_substituto, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_lanche, v.id_princ, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1182, 1222, 150.00::DECIMAL(8,2))  -- Maçã Fuji no lugar da Banana prata
        ) AS v(id_princ, id_sub, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_sub;

        -- Refeição 4: Jantar (20:00)
        INSERT INTO Refeicao (id_plano, nome, horario, dia_semana)
        VALUES (v_plano_pub, 'Jantar', '20:00:00', NULL)
        RETURNING id_refeicao INTO v_ref_jantar;

        INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_jantar, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1088, 180.00::DECIMAL(8,2)), -- Batata, doce, cozida
            (1410, 150.00::DECIMAL(8,2)), -- Frango, peito, sem pele, grelhado
            (1072, 100.00::DECIMAL(8,2)), -- Abobrinha, italiana, refogada
            (1163, 60.00::DECIMAL(8,2)),  -- Abacate, cru
            (1260, 6.00::DECIMAL(8,2))    -- Azeite, de oliva, extra virgem
        ) AS v(id_alimento, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_alimento;

        INSERT INTO Substituto_Item_Refeicao (id_refeicao, id_alimento_principal, id_alimento_substituto, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_jantar, v.id_princ, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1088, 1001, 120.00::DECIMAL(8,2)), -- Arroz integral no lugar da Batata doce
            (1410, 1317, 120.00::DECIMAL(8,2))  -- Salmão grelhado no lugar do Frango
        ) AS v(id_princ, id_sub, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_sub;

        -- 5. Plano Alimentar em RASCUNHO (para facilitar prints da tela de edição na Web)
        INSERT INTO Plano_Alimentar (
            id_paciente, id_nutricionista, id_consulta,
            titulo, orientacoes, status,
            vigencia_inicio, vigencia_fim,
            vet_meta_kcal,
            percentual_carboidratos, percentual_proteina, percentual_gordura,
            meta_carboidratos, meta_proteina, meta_gordura,
            versao
        ) VALUES (
            v_pac.id_paciente, v_nutri_id, NULL,
            'Fase 2 — Hipertrofia e Manutenção Limpa',
            'Proposta para o próximo ciclo com leve superávit calórico controlado e manutenção da distribuição proteica.',
            'RASCUNHO',
            CURRENT_DATE + INTERVAL '21 days',
            CURRENT_DATE + INTERVAL '50 days',
            2200.00,
            50.00, 30.00, 20.00,
            275.00, 165.00, 48.89,
            0
        ) RETURNING id_plano INTO v_plano_rasc;

        INSERT INTO Refeicao (id_plano, nome, horario, dia_semana)
        VALUES (v_plano_rasc, 'Café da manhã', '07:30:00', NULL)
        RETURNING id_refeicao INTO v_ref_rasc_cafe;

        INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_rasc_cafe, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1052, 60.00::DECIMAL(8,2)),
            (1488, 120.00::DECIMAL(8,2)),
            (1182, 100.00::DECIMAL(8,2)),
            (1007, 30.00::DECIMAL(8,2))
        ) AS v(id_alimento, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_alimento;

        INSERT INTO Refeicao (id_plano, nome, horario, dia_semana)
        VALUES (v_plano_rasc, 'Almoço', '12:30:00', NULL)
        RETURNING id_refeicao INTO v_ref_rasc_almoco;

        INSERT INTO Item_Refeicao (id_refeicao, id_alimento, quantidade_gramas, kcal_100g, proteina_100g, carboidratos_100g, gordura_100g, fibra_100g)
        SELECT v_ref_rasc_almoco, a.id_alimento, v.qtd, a.kcal_100g, a.proteina_100g, a.carboidratos_100g, a.gordura_100g, a.fibra_100g
        FROM (VALUES
            (1001, 180.00::DECIMAL(8,2)),
            (1561, 130.00::DECIMAL(8,2)),
            (1410, 160.00::DECIMAL(8,2)),
            (1260, 8.00::DECIMAL(8,2))
        ) AS v(id_alimento, qtd)
        JOIN Alimento a ON a.id_alimento = v.id_alimento;

        -- 6. Lista de Compras (7, 15 e 30 dias) com itens marcados como comprados
        FOREACH v_dias IN ARRAY ARRAY[7, 15, 30] LOOP
            INSERT INTO Lista_Compras (id_plano, data_geracao, dias)
            VALUES (v_plano_pub, CURRENT_DATE, v_dias)
            RETURNING id_lista INTO v_lista_id;

            INSERT INTO Item_Lista_Compras (id_lista, id_alimento, nome_item, quantidade, comprado)
            SELECT v_lista_id, a.id_alimento, a.nome, '1', v.comprado
            FROM (VALUES
                (1001, TRUE),  -- Arroz, integral, cozido (Comprado)
                (1007, TRUE),  -- Aveia, flocos, crua (Comprado)
                (1260, TRUE),  -- Azeite, de oliva, extra virgem (Comprado)
                (1561, TRUE),  -- Feijão, carioca, cozido (Comprado)
                (1410, TRUE),  -- Frango, peito, sem pele, grelhado (Comprado)
                (1488, TRUE),  -- Ovo, de galinha, inteiro, cozido (Comprado)
                (1163, FALSE), -- Abacate, cru (Pendente)
                (1072, FALSE), -- Abobrinha, italiana, refogada (Pendente)
                (1078, FALSE), -- Alface, crespa, crua (Pendente)
                (1182, FALSE), -- Banana, prata, crua (Pendente)
                (1088, FALSE), -- Batata, doce, cozida (Pendente)
                (1448, FALSE), -- Iogurte, natural (Pendente)
                (1226, FALSE), -- Mamão, Papaia, cru (Pendente)
                (1052, FALSE), -- Pão, trigo, forma, integral (Pendente)
                (1157, FALSE)  -- Tomate, com semente, cru (Pendente)
            ) AS v(id_alimento, comprado)
            JOIN Alimento a ON a.id_alimento = v.id_alimento;
        END LOOP;

        -- 7. Consumo das Refeições de Hoje (Tela Inicial: Café da manhã e Almoço concluídos)
        INSERT INTO Consumo_Refeicao (id_paciente, id_refeicao, data_registro, consumida)
        VALUES
            (v_pac.id_paciente, v_ref_cafe, CURRENT_DATE, TRUE),
            (v_pac.id_paciente, v_ref_almoco, CURRENT_DATE, TRUE),
            (v_pac.id_paciente, v_ref_lanche, CURRENT_DATE, FALSE),
            (v_pac.id_paciente, v_ref_jantar, CURRENT_DATE, FALSE);

        -- Hidratação de hoje: 1.750 ml consumidos (meta 2.500 ml = 70%)
        -- (kcal e macros ficam em 0 em Consumo_Diario pois ClinicoService soma com Consumo_Refeicao)
        INSERT INTO Consumo_Diario (
            id_paciente, data_registro,
            kcal_consumidas, proteinas_consumidas, carboidratos_consumidos, gorduras_consumidas,
            agua_ml_consumida
        ) VALUES (
            v_pac.id_paciente, CURRENT_DATE,
            0.00, 0.00, 0.00, 0.00,
            1750
        );

        -- 8. Exames laboratoriais (Analisado, Enviado e Pendente)
        INSERT INTO Exame (
            id_paciente, id_nutricionista, id_consulta,
            nome_exame, descricao_exame,
            data_solicitacao, data_envio,
            arquivo, arquivo_nome, arquivo_tipo, arquivo_tamanho,
            status, parecer, analisado_em, versao
        ) VALUES
        (
            v_pac.id_paciente, v_nutri_id, v_c3,
            'Hemograma Completo e Perfil Lipídico',
            'Avaliação de colesterol total, HDL, LDL, triglicerídeos e série vermelha.',
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE - INTERVAL '15 days',
            v_pdf_bytes, 'hemograma-perfil-lipidico.pdf', 'application/pdf', octet_length(v_pdf_bytes),
            'ANALISADO',
            'Exames dentro da faixa de normalidade, com melhora expressiva na relação HDL/LDL e redução dos triglicerídeos em relação ao exame basal.',
            CURRENT_TIMESTAMP - INTERVAL '10 days',
            2
        ),
        (
            v_pac.id_paciente, v_nutri_id, v_c4,
            'Glicemia de Jejum e Hemoglobina Glicada (HbA1c)',
            'Acompanhamento do metabolismo glicêmico e sensibilidade à insulina.',
            CURRENT_DATE - INTERVAL '10 days',
            CURRENT_DATE - INTERVAL '2 days',
            v_pdf_bytes, 'glicemia-hba1c.pdf', 'application/pdf', octet_length(v_pdf_bytes),
            'ENVIADO',
            NULL,
            NULL,
            1
        ),
        (
            v_pac.id_paciente, v_nutri_id, NULL,
            'Vitamina D (25-OH), Ferritina e Vitamina B12',
            'Monitoramento de micronutrientes para ajuste de suplementação preventiva.',
            CURRENT_DATE - INTERVAL '3 days',
            NULL,
            NULL, NULL, NULL, NULL,
            'PENDENTE',
            NULL,
            NULL,
            0
        );

        -- 9. Anamnese clínica finalizada
        INSERT INTO Anamnese (id_paciente, id_nutricionista, versao, rascunho, finalizada_em, atualizada_em)
        VALUES (
            v_pac.id_paciente, v_nutri_id, 1, NULL,
            CURRENT_TIMESTAMP - INTERVAL '90 days',
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        )
        ON CONFLICT (id_paciente) DO UPDATE
        SET finalizada_em = EXCLUDED.finalizada_em,
            atualizada_em = EXCLUDED.atualizada_em;

        INSERT INTO Resposta_Anamnese (id_paciente, id_pergunta, texto_resposta)
        SELECT v_pac.id_paciente, p.id_pergunta, v.resp
        FROM (VALUES
            ('profession', '"Engenheiro de Software"'),
            ('phone', '"(41) 99999-9999"'),
            ('origin', '"Indicação"'),
            ('weight', '73.6'),
            ('height', '1.75'),
            ('bodyHealth', '"Boa disposição diária, buscando reduzir gordura abdominal e melhorar definição muscular."'),
            ('eatingRoutine', '"Realiza 4 refeições principais ao dia em horários regulares."'),
            ('foodPreferences', '"Gosta de carnes grelhadas, ovos, frutas, arroz integral e aveia. Evita frituras e refrigerantes."'),
            ('mealsPerDay', '4'),
            ('eatsOut', '"Às vezes"'),
            ('physicalActivity', '"Sim"'),
            ('activities', '["Musculação","Corrida"]'),
            ('weeklyFrequency', '"4 a 5 vezes por semana"'),
            ('intensity', '"Moderada"'),
            ('sleepHours', '"7 a 8 horas"'),
            ('rested', '"Sim"'),
            ('stressed', '"Às vezes"'),
            ('objectives', '["Redução de gordura corporal","Ganho de massa muscular","Melhora de performance"]')
        ) AS v(codigo, resp)
        JOIN Pergunta_Anamnese p ON p.codigo = v.codigo
        ON CONFLICT (id_paciente, id_pergunta) DO UPDATE
        SET texto_resposta = EXCLUDED.texto_resposta;

    END LOOP;
END $$;

COMMIT;
