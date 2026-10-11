-- Pacientes e consultas só para enxergar o dashboard. Reexecutável.
-- Nutricionista alvo: nutri@teste.com

DELETE FROM resposta_anamnese
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email ~ '^paciente[0-9]+@teste\.com$'
);
DELETE FROM anamnese
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email ~ '^paciente[0-9]+@teste\.com$'
);
DELETE FROM avaliacao_antropometrica
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email ~ '^paciente[0-9]+@teste\.com$'
);
DELETE FROM consulta
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email ~ '^paciente[0-9]+@teste\.com$'
);
DELETE FROM relacao_clinica
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email ~ '^paciente[0-9]+@teste\.com$'
);
DELETE FROM paciente WHERE email ~ '^paciente[0-9]+@teste\.com$';

INSERT INTO paciente (nome, cpf, data_nascimento, sexo, telefone, email, senha, email_confirmado)
VALUES
    ('Ana Paula Souza', '900.111.222-01', DATE '2010-05-01', 'Feminino', '41990000001', 'paciente1@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Carlos Mendes', '900.111.222-02', DATE '2009-03-12', 'Masculino', '41990000002', 'paciente2@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Mariana Rocha', '900.111.222-03', DATE '2001-01-15', 'Feminino', '41990000003', 'paciente3@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'Jo\00e3o Pedro Lima', '900.111.222-04', DATE '1998-06-20', 'Masculino', '41990000004', 'paciente4@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Fernanda Dias', '900.111.222-05', DATE '1992-02-02', 'Feminino', '41990000005', 'paciente5@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Ricardo Alves', '900.111.222-06', DATE '1988-11-11', 'Masculino', '41990000006', 'paciente6@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Beatriz Nunes', '900.111.222-07', DATE '1982-04-04', 'Feminino', '41990000007', 'paciente7@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Paulo Henrique', '900.111.222-08', DATE '1978-08-08', 'Masculino', '41990000008', 'paciente8@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'L\00facia Ferreira', '900.111.222-09', DATE '1972-07-07', 'Feminino', '41990000009', 'paciente9@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'S\00e9rgio Martins', '900.111.222-10', DATE '1968-09-09', 'Masculino', '41990000010', 'paciente10@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Helena Costa', '900.111.222-11', DATE '1962-01-21', 'Feminino', '41990000011', 'paciente11@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'Ant\00f4nio Ribeiro', '900.111.222-12', DATE '1958-12-12', 'Masculino', '41990000012', 'paciente12@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Irene Barbosa', '900.111.222-13', DATE '1952-03-03', 'Feminino', '41990000013', 'paciente13@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Miguel Torres', '900.111.222-14', DATE '1948-05-05', 'Masculino', '41990000014', 'paciente14@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Olga Pires', '900.111.222-15', DATE '1940-10-10', 'Feminino', '41990000015', 'paciente15@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'Jos\00e9 Carvalho', '900.111.222-16', DATE '1936-02-14', 'Masculino', '41990000016', 'paciente16@teste.com', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE);

INSERT INTO relacao_clinica (id_paciente, id_nutricionista, status)
SELECT p.id_paciente, n.id_nutricionista, 'ATIVA'
FROM paciente p
CROSS JOIN nutricionista n
WHERE p.email ~ '^paciente[0-9]+@teste\.com$'
  AND n.email = 'nutri@teste.com';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista, CURRENT_DATE + horarios.hora, 'AGENDADA'
FROM nutricionista n
JOIN (
    VALUES
        ('paciente1@teste.com', TIME '08:00'),
        ('paciente2@teste.com', TIME '09:30'),
        ('paciente3@teste.com', TIME '11:00'),
        ('paciente4@teste.com', TIME '14:30'),
        ('paciente5@teste.com', TIME '16:00')
) AS horarios(email, hora) ON TRUE
JOIN paciente p ON p.email = horarios.email
WHERE n.email = 'nutri@teste.com';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista,
       date_trunc('week', CURRENT_DATE) + (dias.offset_dias || ' days')::interval + TIME '10:00',
       'AGENDADA'
FROM nutricionista n
JOIN (
    VALUES
        (0, 'paciente6@teste.com'),
        (0, 'paciente7@teste.com'),
        (1, 'paciente8@teste.com'),
        (2, 'paciente9@teste.com'),
        (2, 'paciente10@teste.com'),
        (2, 'paciente11@teste.com'),
        (2, 'paciente12@teste.com'),
        (4, 'paciente13@teste.com'),
        (4, 'paciente14@teste.com'),
        (4, 'paciente15@teste.com'),
        (5, 'paciente16@teste.com')
) AS dias(offset_dias, email) ON TRUE
JOIN paciente p ON p.email = dias.email
WHERE n.email = 'nutri@teste.com'
  AND (date_trunc('week', CURRENT_DATE) + (dias.offset_dias || ' days')::interval)::date <> CURRENT_DATE;

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista,
       date_trunc('month', CURRENT_DATE) - (meses.recuo || ' months')::interval + INTERVAL '10 days' + TIME '09:00',
       'REALIZADA'
FROM nutricionista n
JOIN generate_series(1, 11) AS meses(recuo) ON TRUE
JOIN paciente p ON p.email = 'paciente3@teste.com'
WHERE n.email = 'nutri@teste.com';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista,
       date_trunc('month', CURRENT_DATE) - (meses.recuo || ' months')::interval + INTERVAL '20 days' + TIME '15:00',
       'REALIZADA'
FROM nutricionista n
JOIN (VALUES (2), (4), (7), (9), (11)) AS meses(recuo) ON TRUE
JOIN paciente p ON p.email = 'paciente6@teste.com'
WHERE n.email = 'nutri@teste.com';

INSERT INTO anamnese (id_paciente, versao, finalizada_em, atualizada_em, id_nutricionista)
SELECT p.id_paciente, 0, NOW(), NOW(), n.id_nutricionista
FROM paciente p
CROSS JOIN nutricionista n
WHERE p.email ~ '^paciente[0-9]+@teste\.com$'
  AND n.email = 'nutri@teste.com';

INSERT INTO resposta_anamnese (id_paciente, id_pergunta, texto_resposta)
SELECT p.id_paciente, q.id_pergunta, v.texto
FROM paciente p
JOIN (
    VALUES
        ('profession', '"Analista de sistemas"'),
        ('origin', '"Instagram"'),
        ('objectives', U&'["Emagrecimento","Sa\00fade"]'),
        ('allergy', U&'"N\00e3o"'),
        ('diagnoses', '["Nenhum"]'),
        ('medication', U&'"N\00e3o"'),
        ('physicalActivity', '"Sim"'),
        ('activities', U&'["Muscula\00e7\00e3o","Caminhada"]'),
        ('weeklyFrequency', '"3 a 4 vezes por semana"'),
        ('sleepHours', '"7 a 8 horas"'),
        ('diet', U&'"N\00e3o sigo dieta espec\00edfica"')
) AS v(codigo, texto) ON TRUE
JOIN pergunta_anamnese q ON q.codigo = v.codigo
WHERE p.email ~ '^paciente[0-9]+@teste\.com$';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status, observacao)
SELECT p.id_paciente, n.id_nutricionista,
       (CURRENT_DATE - (s.n * 40))::timestamp + TIME '09:00',
       'REALIZADA',
       'Acompanhamento nutricional'
FROM paciente p
CROSS JOIN nutricionista n
JOIN generate_series(0, 6) AS s(n) ON TRUE
WHERE p.email = 'paciente1@teste.com'
  AND n.email = 'nutri@teste.com';

INSERT INTO avaliacao_antropometrica (
    id_paciente, id_consulta, data_avaliacao, peso, altura, imc, percentual_gordura, massa_muscular_kg,
    prega_bicipital, prega_tricipital, prega_subescapular, prega_suprailiaca,
    circunferencia_cintura, circunferencia_quadril, circunferencia_braco
)
SELECT c.id_paciente, c.id_consulta, c.data_hora,
       68 + s.n,
       1.65,
       round((68 + s.n) / (1.65 * 1.65), 2),
       28 + s.n,
       round(46 + (s.n * 0.4), 2),
       round(10 + (s.n * 0.3), 2),
       round(15 + (s.n * 0.4), 2),
       round(14 + (s.n * 0.3), 2),
       round(17 + (s.n * 0.4), 2),
       68 + s.n,
       round(94 + (s.n * 0.5), 2),
       round(31 + (s.n * 0.3), 2)
FROM consulta c
JOIN paciente p ON p.id_paciente = c.id_paciente
JOIN generate_series(0, 6) AS s(n)
    ON c.data_hora = (CURRENT_DATE - (s.n * 40))::timestamp + TIME '09:00'
WHERE p.email = 'paciente1@teste.com'
  AND c.status = 'REALIZADA';
