-- Solicitações antigas sem origem confirmada permanecem sem classificação específica.
ALTER TABLE Consulta ADD COLUMN reagendada BOOLEAN;
