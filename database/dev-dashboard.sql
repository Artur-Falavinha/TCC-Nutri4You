-- Pacientes e consultas só para enxergar o dashboard. Reexecutável.
-- Nutricionista alvo: nutri@nutri4you.com

DELETE FROM avaliacao_antropometrica
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email LIKE 'dashboard-demo-%@nutri4you.test'
);
DELETE FROM consulta
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email LIKE 'dashboard-demo-%@nutri4you.test'
);
DELETE FROM relacao_clinica
WHERE id_paciente IN (
    SELECT id_paciente FROM paciente WHERE email LIKE 'dashboard-demo-%@nutri4you.test'
);
DELETE FROM paciente WHERE email LIKE 'dashboard-demo-%@nutri4you.test';

INSERT INTO paciente (nome, cpf, data_nascimento, sexo, telefone, email, senha, email_confirmado)
VALUES
    ('Ana Paula Souza', '900.111.222-01', DATE '2010-05-01', 'Feminino', '41990000001', 'dashboard-demo-01@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Carlos Mendes', '900.111.222-02', DATE '2009-03-12', 'Masculino', '41990000002', 'dashboard-demo-02@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Mariana Rocha', '900.111.222-03', DATE '2001-01-15', 'Feminino', '41990000003', 'dashboard-demo-03@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'Jo\00e3o Pedro Lima', '900.111.222-04', DATE '1998-06-20', 'Masculino', '41990000004', 'dashboard-demo-04@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Fernanda Dias', '900.111.222-05', DATE '1992-02-02', 'Feminino', '41990000005', 'dashboard-demo-05@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Ricardo Alves', '900.111.222-06', DATE '1988-11-11', 'Masculino', '41990000006', 'dashboard-demo-06@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Beatriz Nunes', '900.111.222-07', DATE '1982-04-04', 'Feminino', '41990000007', 'dashboard-demo-07@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Paulo Henrique', '900.111.222-08', DATE '1978-08-08', 'Masculino', '41990000008', 'dashboard-demo-08@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'L\00facia Ferreira', '900.111.222-09', DATE '1972-07-07', 'Feminino', '41990000009', 'dashboard-demo-09@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'S\00e9rgio Martins', '900.111.222-10', DATE '1968-09-09', 'Masculino', '41990000010', 'dashboard-demo-10@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Helena Costa', '900.111.222-11', DATE '1962-01-21', 'Feminino', '41990000011', 'dashboard-demo-11@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'Ant\00f4nio Ribeiro', '900.111.222-12', DATE '1958-12-12', 'Masculino', '41990000012', 'dashboard-demo-12@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Irene Barbosa', '900.111.222-13', DATE '1952-03-03', 'Feminino', '41990000013', 'dashboard-demo-13@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Miguel Torres', '900.111.222-14', DATE '1948-05-05', 'Masculino', '41990000014', 'dashboard-demo-14@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    ('Olga Pires', '900.111.222-15', DATE '1940-10-10', 'Feminino', '41990000015', 'dashboard-demo-15@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE),
    (U&'Jos\00e9 Carvalho', '900.111.222-16', DATE '1936-02-14', 'Masculino', '41990000016', 'dashboard-demo-16@nutri4you.test', '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.', TRUE);

INSERT INTO relacao_clinica (id_paciente, id_nutricionista, status)
SELECT p.id_paciente, n.id_nutricionista, 'ATIVA'
FROM paciente p
CROSS JOIN nutricionista n
WHERE p.email LIKE 'dashboard-demo-%@nutri4you.test'
  AND n.email = 'nutri@nutri4you.com';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista, CURRENT_DATE + horarios.hora, 'AGENDADA'
FROM nutricionista n
JOIN (
    VALUES
        ('dashboard-demo-01@nutri4you.test', TIME '08:00'),
        ('dashboard-demo-02@nutri4you.test', TIME '09:30'),
        ('dashboard-demo-03@nutri4you.test', TIME '11:00'),
        ('dashboard-demo-04@nutri4you.test', TIME '14:30'),
        ('dashboard-demo-05@nutri4you.test', TIME '16:00')
) AS horarios(email, hora) ON TRUE
JOIN paciente p ON p.email = horarios.email
WHERE n.email = 'nutri@nutri4you.com';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista,
       date_trunc('week', CURRENT_DATE) + (dias.offset_dias || ' days')::interval + TIME '10:00',
       'AGENDADA'
FROM nutricionista n
JOIN (
    VALUES
        (0, 'dashboard-demo-06@nutri4you.test'),
        (0, 'dashboard-demo-07@nutri4you.test'),
        (1, 'dashboard-demo-08@nutri4you.test'),
        (2, 'dashboard-demo-09@nutri4you.test'),
        (2, 'dashboard-demo-10@nutri4you.test'),
        (2, 'dashboard-demo-11@nutri4you.test'),
        (2, 'dashboard-demo-12@nutri4you.test'),
        (4, 'dashboard-demo-13@nutri4you.test'),
        (4, 'dashboard-demo-14@nutri4you.test'),
        (4, 'dashboard-demo-15@nutri4you.test'),
        (5, 'dashboard-demo-16@nutri4you.test')
) AS dias(offset_dias, email) ON TRUE
JOIN paciente p ON p.email = dias.email
WHERE n.email = 'nutri@nutri4you.com'
  AND (date_trunc('week', CURRENT_DATE) + (dias.offset_dias || ' days')::interval)::date <> CURRENT_DATE;

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista,
       date_trunc('month', CURRENT_DATE) - (meses.recuo || ' months')::interval + INTERVAL '10 days' + TIME '09:00',
       'REALIZADA'
FROM nutricionista n
JOIN generate_series(1, 11) AS meses(recuo) ON TRUE
JOIN paciente p ON p.email = 'dashboard-demo-03@nutri4you.test'
WHERE n.email = 'nutri@nutri4you.com';

INSERT INTO consulta (id_paciente, id_nutricionista, data_hora, status)
SELECT p.id_paciente, n.id_nutricionista,
       date_trunc('month', CURRENT_DATE) - (meses.recuo || ' months')::interval + INTERVAL '20 days' + TIME '15:00',
       'REALIZADA'
FROM nutricionista n
JOIN (VALUES (2), (4), (7), (9), (11)) AS meses(recuo) ON TRUE
JOIN paciente p ON p.email = 'dashboard-demo-06@nutri4you.test'
WHERE n.email = 'nutri@nutri4you.com';
