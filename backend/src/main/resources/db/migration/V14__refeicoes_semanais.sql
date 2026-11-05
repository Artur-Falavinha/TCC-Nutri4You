ALTER TABLE Plano_Alimentar ADD COLUMN atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Ausência de dia preserva a repetição diária dos planos anteriores à agenda semanal.
ALTER TABLE Refeicao ADD COLUMN dia_semana INT CHECK (dia_semana BETWEEN 1 AND 7);
CREATE INDEX idx_refeicao_plano_dia ON Refeicao(id_plano, dia_semana, horario);
