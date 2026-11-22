ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS prega_peitoral DECIMAL(5,2);
ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS prega_axilar_media DECIMAL(5,2);
ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS prega_abdominal DECIMAL(5,2);
ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS prega_coxa DECIMAL(5,2);
ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS massa_magra_kg DECIMAL(5,2);
ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS massa_gorda_kg DECIMAL(5,2);
ALTER TABLE Avaliacao_Antropometrica ADD COLUMN IF NOT EXISTS metodo_percentual_gordura VARCHAR(60);
