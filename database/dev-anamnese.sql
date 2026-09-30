-- Nutritionist: anamnese@nutri4you.test / NutriTeste@123
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO Nutricionista (nome, email, senha, crn)
VALUES ('Nutricionista Teste Anamnese', 'anamnese@nutri4you.test',
    crypt('NutriTeste@123', gen_salt('bf', 10)), 'TESTE-ANAMNESE')
ON CONFLICT (email) DO NOTHING;
INSERT INTO Paciente (nome, email, senha, data_nascimento, sexo, telefone, email_confirmado)
VALUES
    ('Amanda Teste - Nova anamnese', 'amanda.anamnese@nutri4you.test', crypt('PacienteTeste@123', gen_salt('bf', 10)), '1995-03-12', 'Feminino', '41999990001', TRUE),
    ('Bruno Teste - Rascunho', 'bruno.anamnese@nutri4you.test', crypt('PacienteTeste@123', gen_salt('bf', 10)), '1990-07-20', 'Masculino', '41999990002', TRUE),
    ('Carla Teste - Finalizada', 'carla.anamnese@nutri4you.test', crypt('PacienteTeste@123', gen_salt('bf', 10)), '1988-11-05', 'Feminino', '41999990003', TRUE)
ON CONFLICT (email) DO NOTHING;
INSERT INTO Relacao_Clinica (id_paciente, id_nutricionista, status)
SELECT p.id_paciente, n.id_nutricionista, 'ATIVA'
FROM Paciente p CROSS JOIN Nutricionista n
WHERE p.email IN ('amanda.anamnese@nutri4you.test', 'bruno.anamnese@nutri4you.test', 'carla.anamnese@nutri4you.test')
  AND n.email = 'anamnese@nutri4you.test'
ON CONFLICT (id_paciente, id_nutricionista) DO NOTHING;
COMMIT;
