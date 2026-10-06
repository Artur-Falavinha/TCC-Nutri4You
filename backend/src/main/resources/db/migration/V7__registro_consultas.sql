ALTER TABLE Consulta ALTER COLUMN observacao TYPE TEXT;
ALTER TABLE Consulta ADD COLUMN versao BIGINT NOT NULL DEFAULT 0;
ALTER TABLE Consulta ADD COLUMN atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Avaliacao_Antropometrica ALTER COLUMN imc TYPE NUMERIC(7, 2);

CREATE INDEX idx_consulta_paciente_nutricionista_data
    ON Consulta (id_paciente, id_nutricionista, data_hora DESC, id_consulta DESC);
