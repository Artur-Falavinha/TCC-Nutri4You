ALTER TABLE Exame ADD COLUMN versao BIGINT NOT NULL DEFAULT 0;
ALTER TABLE Exame ADD COLUMN arquivo_nome VARCHAR(150);
ALTER TABLE Exame ADD COLUMN arquivo_tipo VARCHAR(100);
ALTER TABLE Exame ADD COLUMN arquivo_tamanho BIGINT;
ALTER TABLE Exame ADD COLUMN parecer TEXT;
ALTER TABLE Exame ADD COLUMN analisado_em TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_exame_paciente ON Exame(id_paciente, id_exame DESC);
CREATE INDEX idx_exame_autor ON Exame(id_nutricionista, id_paciente, id_exame DESC);
