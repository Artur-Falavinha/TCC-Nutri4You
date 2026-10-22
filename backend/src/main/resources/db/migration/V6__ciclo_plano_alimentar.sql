ALTER TABLE Plano_Alimentar ADD COLUMN id_paciente INT;
ALTER TABLE Plano_Alimentar ADD COLUMN id_nutricionista INT;
ALTER TABLE Plano_Alimentar ALTER COLUMN id_consulta DROP NOT NULL;
ALTER TABLE Plano_Alimentar ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE Plano_Alimentar ADD COLUMN vigencia_inicio DATE;
ALTER TABLE Plano_Alimentar ADD COLUMN vigencia_fim DATE;
ALTER TABLE Plano_Alimentar ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Plano_Alimentar ADD COLUMN publicado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE Plano_Alimentar ADD COLUMN versao BIGINT NOT NULL DEFAULT 0;

UPDATE Plano_Alimentar p
SET id_paciente = c.id_paciente, id_nutricionista = c.id_nutricionista
FROM Consulta c
WHERE p.id_consulta = c.id_consulta;

ALTER TABLE Plano_Alimentar ALTER COLUMN id_paciente SET NOT NULL;
ALTER TABLE Plano_Alimentar ALTER COLUMN id_nutricionista SET NOT NULL;
ALTER TABLE Plano_Alimentar ADD CONSTRAINT fk_plano_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente);
ALTER TABLE Plano_Alimentar ADD CONSTRAINT fk_plano_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista);
ALTER TABLE Plano_Alimentar ADD CONSTRAINT chk_plano_status CHECK (status IN ('RASCUNHO', 'PUBLICADO', 'SUBSTITUIDO'));
ALTER TABLE Plano_Alimentar ADD CONSTRAINT chk_plano_vigencia CHECK (vigencia_fim IS NULL OR vigencia_inicio IS NULL OR vigencia_fim >= vigencia_inicio);
CREATE INDEX idx_plano_paciente_status_vigencia ON Plano_Alimentar (id_paciente, status, vigencia_inicio, vigencia_fim);
