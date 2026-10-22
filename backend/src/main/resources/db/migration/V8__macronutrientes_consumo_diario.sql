ALTER TABLE Consumo_Diario
    ADD COLUMN IF NOT EXISTS proteinas_consumidas DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS carboidratos_consumidos DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gorduras_consumidas DECIMAL(8,2) DEFAULT 0;
