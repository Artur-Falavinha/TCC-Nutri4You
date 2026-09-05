-- ==========================================
-- SCRIPT DDL: Nutri4You (PostgreSQL)
-- ==========================================

-- 1. ATORES DO SISTEMA E VÍNCULO
CREATE TABLE Nutricionista (
    id_nutricionista SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    crn VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE Paciente (
    id_paciente SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    sexo VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE Vinculo_Nutricional (
    id_vinculo SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_nutricionista INT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ATIVO',
    CONSTRAINT unq_vinculo UNIQUE (id_paciente, id_nutricionista),
    CONSTRAINT fk_vinculo_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_vinculo_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista)
);

-- 2. ANAMNESE E HISTÓRICO CLÍNICO
CREATE TABLE Pergunta_Anamnese (
    id_pergunta SERIAL PRIMARY KEY,
    id_nutricionista INT, 
    categoria VARCHAR(100),
    texto_pergunta VARCHAR(255) NOT NULL,
    tipo_resposta VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_pergunta_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista)
);

CREATE TABLE Resposta_Anamnese (
    id_resposta SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_pergunta INT NOT NULL,
    texto_resposta TEXT,
    data_ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resposta_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_resposta_pergunta FOREIGN KEY (id_pergunta) REFERENCES Pergunta_Anamnese(id_pergunta)
);

-- Trigger para replicar o "ON UPDATE CURRENT_TIMESTAMP" do MySQL
CREATE OR REPLACE FUNCTION update_timestamp_resposta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_ultima_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualiza_timestamp_resposta
BEFORE UPDATE ON Resposta_Anamnese
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_resposta();


-- 3. ATENDIMENTO CLÍNICO
CREATE TABLE Consulta (
    id_consulta SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_nutricionista INT NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'AGUARDANDO_CONFIRMACAO',
    observacao VARCHAR(255),
    id_evento_calendar VARCHAR(255), 
    CONSTRAINT fk_consulta_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_consulta_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista)
);

CREATE TABLE Avaliacao_Antropometrica (
    id_avaliacao SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_consulta INT UNIQUE, 
    data_avaliacao TIMESTAMP NOT NULL,
    peso DECIMAL(5,2),
    altura DECIMAL(3,2),
    imc DECIMAL(5,2),
    percentual_gordura DECIMAL(5,2),
    massa_muscular_kg DECIMAL(5,2),
    prega_bicipital DECIMAL(5,2),
    prega_tricipital DECIMAL(5,2),
    prega_subescapular DECIMAL(5,2),
    prega_suprailiaca DECIMAL(5,2),
    circunferencia_cintura DECIMAL(5,2),
    circunferencia_quadril DECIMAL(5,2),
    circunferencia_braco DECIMAL(5,2),
    CONSTRAINT fk_avaliacao_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_avaliacao_consulta FOREIGN KEY (id_consulta) REFERENCES Consulta(id_consulta)
);

CREATE TABLE Exame (
    id_exame SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_nutricionista INT NOT NULL,
    nome_exame VARCHAR(150) NOT NULL,
    descricao_exame TEXT,
    data_solicitacao DATE,
    data_envio DATE,
    arquivo BYTEA, -- MySQL BLOB convertido para PostgreSQL BYTEA
    status VARCHAR(30) DEFAULT 'PENDENTE',
    CONSTRAINT fk_exame_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_exame_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista)
);

-- 4. PRESCRIÇÃO E DIETA
CREATE TABLE Plano_Alimentar (
    id_plano SERIAL PRIMARY KEY,
    id_consulta INT NOT NULL UNIQUE,
    vet_meta_kcal DECIMAL(6,2),
    meta_carboidratos DECIMAL(6,2),
    meta_gordura DECIMAL(6,2),
    meta_proteina DECIMAL(6,2),
    CONSTRAINT fk_plano_consulta FOREIGN KEY (id_consulta) REFERENCES Consulta(id_consulta)
);

CREATE TABLE Lista_Compras (
    id_lista SERIAL PRIMARY KEY,
    id_plano INT NOT NULL UNIQUE,
    data_geracao DATE NOT NULL,
    CONSTRAINT fk_lista_plano FOREIGN KEY (id_plano) REFERENCES Plano_Alimentar(id_plano)
);

CREATE TABLE Item_Lista_Compras (
    id_item_lista SERIAL PRIMARY KEY,
    id_lista INT NOT NULL,
    nome_item VARCHAR(150) NOT NULL,
    quantidade VARCHAR(50),
    comprado BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_item_lista FOREIGN KEY (id_lista) REFERENCES Lista_Compras(id_lista)
);

CREATE TABLE Refeicao (
    id_refeicao SERIAL PRIMARY KEY,
    id_plano INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    horario TIME NOT NULL,
    CONSTRAINT fk_refeicao_plano FOREIGN KEY (id_plano) REFERENCES Plano_Alimentar(id_plano)
);

-- 5. ACOMPANHAMENTO DIÁRIO (APP MOBILE)
CREATE TABLE Consumo_Diario (
    id_consumo SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    data_registro DATE NOT NULL,
    kcal_consumidas DECIMAL(6,2) DEFAULT 0,
    agua_ml_consumida INT DEFAULT 0,
    CONSTRAINT unq_consumo_diario UNIQUE (id_paciente, data_registro),
    CONSTRAINT fk_consumo_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente)
);

-- 6. BANCO DE ALIMENTOS (TACO)
CREATE TABLE Alimento (
    id_alimento SERIAL PRIMARY KEY,
    categoria VARCHAR(100),
    nome VARCHAR(150) NOT NULL,
    kcal_100g DECIMAL(6,2),
    proteina_100g DECIMAL(6,2),
    carboidratos_100g DECIMAL(6,2)
);

CREATE TABLE Item_Refeicao (
    id_refeicao INT NOT NULL,
    id_alimento INT NOT NULL,
    quantidade_gramas DECIMAL(6,2) NOT NULL,
    PRIMARY KEY (id_refeicao, id_alimento),
    CONSTRAINT fk_itemrefeicao_refeicao FOREIGN KEY (id_refeicao) REFERENCES Refeicao(id_refeicao),
    CONSTRAINT fk_itemrefeicao_alimento FOREIGN KEY (id_alimento) REFERENCES Alimento(id_alimento)
);

-- ==========================================
-- DADOS DE TESTE INICIAIS (Mock)
-- ==========================================

-- 1. NUTRICIONISTAS
INSERT INTO Nutricionista (nome, email, senha, crn) VALUES
('Gabriel de Paula Brasil', 'nutri@nutri4you.com', '$2a$10$ExemploDeHashBcryptParaSenha123', 'CRN8-12345');

-- 2. PACIENTES
INSERT INTO Paciente (nome, cpf, data_nascimento, sexo, telefone, email, senha) VALUES
('Arthur Henrique Deretti', '111.222.333-44', '2000-01-01', 'Masculino', '41999999999', 'arthur@email.com', '$2a$10$ExemploDeHashBcrypt'),
('Artur Lachoman Falavinha', '555.666.777-88', '2000-02-02', 'Masculino', '41988888888', 'artur@email.com', '$2a$10$ExemploDeHashBcrypt');

-- 3. VÍNCULOS NUTRICIONAIS
INSERT INTO Vinculo_Nutricional (id_paciente, id_nutricionista, data_inicio, status) VALUES
(1, 1, '2026-09-01', 'ATIVO'),
(2, 1, '2026-09-01', 'ATIVO');

-- 4. ALIMENTOS (Base TACO simplificada)
INSERT INTO Alimento (categoria, nome, kcal_100g, proteina_100g, carboidratos_100g) VALUES
('Cereais', 'Arroz branco cozido', 128.00, 2.50, 28.10),
('Leguminosas', 'Feijão carioca cozido', 76.00, 4.80, 13.60),
('Carnes', 'Peito de frango grelhado', 159.00, 32.00, 0.00),
('Ovos', 'Ovo de galinha cozido', 146.00, 13.30, 0.60),
('Frutas', 'Banana prata', 98.00, 1.30, 26.00);

-- 5. PERGUNTAS DE ANAMNESE PADRÃO
INSERT INTO Pergunta_Anamnese (id_nutricionista, categoria, texto_pergunta, tipo_resposta, ativo) VALUES
(1, 'Geral', 'Possui alguma alergia ou intolerância alimentar?', 'TEXTO', TRUE),
(1, 'Hábitos', 'Quantos copos de água costuma beber por dia?', 'TEXTO', TRUE),
(1, 'Saúde', 'Faz uso de algum medicamento contínuo?', 'TEXTO', TRUE);