-- ==========================================
-- SCRIPT DDL: Nutri4You (PostgreSQL)
-- ==========================================

-- 1. ATORES DO SISTEMA
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
    senha VARCHAR(255) NOT NULL,
    email_confirmado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE Token_Email (
    id_token SERIAL PRIMARY KEY,
    token UUID NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL,
    id_paciente INT,
    id_nutricionista INT,
    expira_em TIMESTAMP NOT NULL,
    usado_em TIMESTAMP,
    CONSTRAINT fk_token_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_token_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista),
    CONSTRAINT chk_token_titular CHECK (
        (id_paciente IS NOT NULL AND id_nutricionista IS NULL)
        OR (id_paciente IS NULL AND id_nutricionista IS NOT NULL)
    )
);

CREATE TABLE Relacao_Clinica (
    id_relacao SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_nutricionista INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',
    iniciada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    encerrada_em TIMESTAMP,
    CONSTRAINT fk_rel_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_rel_nutri FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista),
    CONSTRAINT uq_rel_par UNIQUE (id_paciente, id_nutricionista)
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
-- Senha dev em texto: password
INSERT INTO Nutricionista (nome, email, senha, crn) VALUES
('Gabriel de Paula Brasil', 'nutri@nutri4you.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', 'CRN8-12345');

-- 2. PACIENTES
INSERT INTO Paciente (nome, cpf, data_nascimento, sexo, telefone, email, senha, email_confirmado) VALUES
('Arthur Henrique Deretti', '111.222.333-44', '2000-01-01', 'Masculino', '41999999999', 'arthur@email.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
('Artur Lachoman Falavinha', '555.666.777-88', '2000-02-02', 'Masculino', '41988888888', 'artur@email.com', '$2a$10$ExemploDeHashBcrypt', TRUE);

-- 3. CONSULTAS (relaciona paciente e nutricionista por evento)
INSERT INTO Consulta (id_paciente, id_nutricionista, data_hora, status) VALUES
(1, 1, '2026-09-01 10:00:00', 'REALIZADA'),
(2, 1, '2026-09-01 11:00:00', 'REALIZADA');

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

-- One current record per patient; a draft never replaces finalized answers.
ALTER TABLE Pergunta_Anamnese ADD COLUMN IF NOT EXISTS codigo VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pergunta_codigo ON Pergunta_Anamnese(codigo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_resposta_paciente_pergunta ON Resposta_Anamnese(id_paciente, id_pergunta);

CREATE TABLE IF NOT EXISTS Anamnese (
    id_paciente INT PRIMARY KEY REFERENCES Paciente(id_paciente),
    versao BIGINT NOT NULL DEFAULT 0,
    rascunho TEXT,
    finalizada_em TIMESTAMP,
    atualizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_nutricionista INT NOT NULL REFERENCES Nutricionista(id_nutricionista)
);

INSERT INTO Pergunta_Anamnese (codigo, categoria, texto_pergunta, tipo_resposta, ativo) VALUES
('profession', 'Trabalho e contato', 'Profissão', 'text', TRUE),
('phone', 'Trabalho e contato', 'Número/WhatsApp', 'tel', TRUE),
('origin', 'Origem', 'Como chegou até nós?', 'select', TRUE),
('originOther', 'Origem', 'Informe como chegou até nós', 'text', TRUE),
('bodyHealth', 'Relacionamento com Comida e Hábitos', 'Como você se sente em relação ao seu corpo e saúde no dia a dia?', 'textarea', TRUE),
('eatingRoutine', 'Relacionamento com Comida e Hábitos', 'Como está sua rotina alimentar?', 'textarea', TRUE),
('foodPreferences', 'Relacionamento com Comida e Hábitos', 'Quais alimentos ou preparações você gosta, evita ou sente dificuldade em incluir?', 'textarea', TRUE),
('hungerMoments', 'Relacionamento com Comida e Hábitos', 'Em quais momentos você percebe mais fome ou vontade de comer?', 'textarea', TRUE),
('emotions', 'Relacionamento com Comida e Hábitos', 'Como costuma lidar com emoções, ansiedade ou cansaço na alimentação?', 'textarea', TRUE),
('foodRules', 'Relacionamento com Comida e Hábitos', 'Existe algum medo ou regra alimentar que você sente que pesa na sua rotina?', 'textarea', TRUE),
('emotionalHunger', 'Relacionamento com Comida e Hábitos', 'Fome emocional', 'range', TRUE),
('bodySatisfaction', 'Relacionamento com Comida e Hábitos', 'Satisfação corporal', 'range', TRUE),
('mealPleasure', 'Relacionamento com Comida e Hábitos', 'Prazer ao se alimentar', 'range', TRUE),
('typicalDay', 'Rotina Alimentar', 'Conte como costuma ser um dia alimentar típico', 'textarea', TRUE),
('mealsPerDay', 'Rotina Alimentar', 'Quantas refeições faz por dia?', 'number', TRUE),
('eatsOut', 'Rotina Alimentar', 'Costuma fazer refeições fora de casa?', 'select', TRUE),
('diet', 'Rotina Alimentar', 'Tem alguma dieta específica?', 'select', TRUE),
('dietOther', 'Rotina Alimentar', 'Qual dieta específica?', 'text', TRUE),
('supplement', 'Rotina Alimentar', 'Você faz uso de suplementos?', 'select', TRUE),
('supplementDetails', 'Rotina Alimentar', 'Quais suplementos utiliza?', 'text', TRUE),
('improvements', 'Rotina Alimentar', 'Há algo na sua rotina alimentar que gostaria de melhorar?', 'textarea', TRUE),
('diagnoses', 'Histórico de Saúde', 'Diagnóstico atual', 'checkbox', TRUE),
('diagnosisOther', 'Histórico de Saúde', 'Qual diagnóstico?', 'text', TRUE),
('medication', 'Histórico de Saúde', 'Usa medicação atualmente?', 'select', TRUE),
('medicationDetails', 'Histórico de Saúde', 'Quais medicações utiliza?', 'textarea', TRUE),
('allergy', 'Histórico de Saúde', 'Tem alergias?', 'select', TRUE),
('allergyDetails', 'Histórico de Saúde', 'Quais alergias?', 'textarea', TRUE),
('recentExams', 'Histórico de Saúde', 'Possui exames recentes?', 'select', TRUE),
('exam', 'Histórico de Saúde', 'Qual exame?', 'select', TRUE),
('examOther', 'Histórico de Saúde', 'Informe o exame', 'text', TRUE),
('familyHistory', 'Histórico de Saúde', 'Histórico familiar relevante?', 'select', TRUE),
('familyCondition', 'Histórico de Saúde', 'Qual condição?', 'select', TRUE),
('familyConditionOther', 'Histórico de Saúde', 'Informe a condição', 'text', TRUE),
('digestiveHealth', 'Histórico de Saúde', 'Observações sobre saúde digestiva', 'textarea', TRUE),
('urineColor', 'Histórico de Saúde', 'Cor da urina habitual', 'select', TRUE),
('laxative', 'Histórico de Saúde', 'Faz uso de laxantes?', 'select', TRUE),
('laxativeDetails', 'Histórico de Saúde', 'Qual laxante e frequência de uso?', 'text', TRUE),
('bristol', 'Histórico de Saúde', 'Fezes (Escala de Bristol)', 'select', TRUE),
('stoolColor', 'Histórico de Saúde', 'Cor das fezes', 'select', TRUE),
('stoolOdor', 'Histórico de Saúde', 'Odor das fezes', 'select', TRUE),
('evacuationFrequency', 'Histórico de Saúde', 'Regularidade de evacuação', 'select', TRUE),
('physicalActivity', 'Atividade Física', 'Pratica atividade física regularmente?', 'select', TRUE),
('activities', 'Atividade Física', 'Tipo de atividade', 'checkbox', TRUE),
('activityOther', 'Atividade Física', 'Qual atividade?', 'text', TRUE),
('weeklyFrequency', 'Atividade Física', 'Frequência semanal', 'select', TRUE),
('intensity', 'Atividade Física', 'Intensidade', 'select', TRUE),
('sleepHours', 'Sono e Estresse', 'Quantas horas de sono costuma ter por noite?', 'select', TRUE),
('rested', 'Sono e Estresse', 'Sente-se descansado(a) ao acordar?', 'select', TRUE),
('stressed', 'Sono e Estresse', 'Sente-se frequentemente estressado(a)?', 'select', TRUE),
('objectives', 'Objetivos e Expectativas', 'Quais seus principais objetivos?', 'checkbox', TRUE),
('objectiveOther', 'Objetivos e Expectativas', 'Qual objetivo?', 'text', TRUE),
('previousAttempts', 'Objetivos e Expectativas', 'Já tentou alcançar esses objetivos antes? Como foi?', 'textarea', TRUE),
('deadline', 'Objetivos e Expectativas', 'Possui prazo para atingir seus objetivos?', 'select', TRUE),
('deadlineReason', 'Objetivos e Expectativas', 'Por que esse prazo é importante?', 'textarea', TRUE),
('finalNotes', 'Considerações finais', 'Existe algo mais que gostaria de compartilhar sobre hábitos ou saúde?', 'textarea', TRUE)
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE Anamnese
    ALTER COLUMN finalizada_em TYPE TIMESTAMPTZ USING finalizada_em AT TIME ZONE 'UTC',
    ALTER COLUMN atualizada_em TYPE TIMESTAMPTZ USING atualizada_em AT TIME ZONE 'UTC';
