ALTER TABLE Plano_Alimentar ADD COLUMN atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Refeicao ADD COLUMN dia_semana INT NOT NULL DEFAULT 1 CHECK (dia_semana BETWEEN 1 AND 7);
ALTER TABLE Alimento ADD COLUMN gordura_100g DECIMAL(6,2);
CREATE INDEX idx_refeicao_plano_dia ON Refeicao(id_plano, dia_semana, horario);
