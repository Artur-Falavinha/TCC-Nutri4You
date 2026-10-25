-- Evolução do schema para suportar integração com Tabela TACO, prescrição de dieta por dia da semana,
-- alimentos substitutos e lista de compras derivada (Sprint 4 - RF10 a RF14 / HU012).

-- 1. Tabela Alimento (Catálogo TACO)
ALTER TABLE Alimento ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE Alimento ALTER COLUMN categoria TYPE VARCHAR(100);
ALTER TABLE Alimento ADD COLUMN IF NOT EXISTS numero_taco INT UNIQUE;
ALTER TABLE Alimento ADD COLUMN IF NOT EXISTS gordura_100g DECIMAL(6,2) DEFAULT 0;
ALTER TABLE Alimento ADD COLUMN IF NOT EXISTS fibra_100g DECIMAL(6,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_alimento_nome_lower ON Alimento (LOWER(nome));
CREATE INDEX IF NOT EXISTS idx_alimento_categoria ON Alimento (categoria);

-- 2. Tabela Plano_Alimentar (amplia precisão das metas de macronutrientes e calorias e adiciona metadados)
ALTER TABLE Plano_Alimentar ALTER COLUMN vet_meta_kcal TYPE DECIMAL(8,2);
ALTER TABLE Plano_Alimentar ALTER COLUMN meta_carboidratos TYPE DECIMAL(8,2);
ALTER TABLE Plano_Alimentar ALTER COLUMN meta_gordura TYPE DECIMAL(8,2);
ALTER TABLE Plano_Alimentar ALTER COLUMN meta_proteina TYPE DECIMAL(8,2);
ALTER TABLE Plano_Alimentar ADD COLUMN IF NOT EXISTS titulo VARCHAR(100) NOT NULL DEFAULT 'Plano alimentar';
ALTER TABLE Plano_Alimentar ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 3. Tabela Refeicao (suporte a dia da semana, descrição e ordenação)
ALTER TABLE Refeicao ALTER COLUMN nome TYPE VARCHAR(100);
ALTER TABLE Refeicao ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(20) NOT NULL DEFAULT 'SEGUNDA';
ALTER TABLE Refeicao ADD COLUMN IF NOT EXISTS descricao VARCHAR(255);
ALTER TABLE Refeicao ADD COLUMN IF NOT EXISTS ordem INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_refeicao_plano_dia ON Refeicao (id_plano, dia_semana, ordem);

-- 4. Tabela Item_Refeicao (chave primária própria e suporte a alimentos substitutos)
ALTER TABLE Item_Refeicao DROP CONSTRAINT IF EXISTS item_refeicao_pkey;
ALTER TABLE Item_Refeicao ADD COLUMN IF NOT EXISTS id_item_refeicao SERIAL PRIMARY KEY;
ALTER TABLE Item_Refeicao ADD COLUMN IF NOT EXISTS id_item_principal INT REFERENCES Item_Refeicao(id_item_refeicao) ON DELETE CASCADE;
ALTER TABLE Item_Refeicao ADD COLUMN IF NOT EXISTS ordem INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_item_refeicao_refeicao ON Item_Refeicao (id_refeicao, ordem);
CREATE INDEX IF NOT EXISTS idx_item_refeicao_principal ON Item_Refeicao (id_item_principal);

-- 5. Tabela Item_Lista_Compras (vínculo com alimento TACO, categoria e quantidade consolidada)
ALTER TABLE Item_Lista_Compras ADD COLUMN IF NOT EXISTS id_alimento INT REFERENCES Alimento(id_alimento) ON DELETE SET NULL;
ALTER TABLE Item_Lista_Compras ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE Item_Lista_Compras ADD COLUMN IF NOT EXISTS quantidade_gramas DECIMAL(8,2) DEFAULT 0;

