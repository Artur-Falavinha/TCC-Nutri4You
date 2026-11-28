ALTER TABLE paciente
    ADD COLUMN lembretes_consulta_ativos BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE notificacao_consulta_paciente
    DROP CONSTRAINT notificacao_consulta_paciente_id_consulta_versao_consulta_key,
    ADD CONSTRAINT uq_notificacao_consulta_versao_tipo UNIQUE (id_consulta, versao_consulta, tipo);

CREATE UNIQUE INDEX uq_lembrete_consulta_horario
    ON notificacao_consulta_paciente (id_consulta, data_hora)
    WHERE tipo = 'LEMBRETE_24H';

CREATE INDEX idx_consulta_horarios_lembrete
    ON consulta (data_hora, id_consulta)
    WHERE status = 'CONFIRMADA' AND iniciada_em IS NULL;
