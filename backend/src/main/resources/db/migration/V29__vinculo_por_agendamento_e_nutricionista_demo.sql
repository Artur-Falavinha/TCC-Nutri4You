INSERT INTO Nutricionista (nome, email, senha, crn, aceita_consultas_avulsas, email_confirmado)
VALUES (
    'Mariana Costa',
    'mariana@nutri4you.com',
    '$2a$10$XURPShQNCsLjp1ESc2laoObo9QZDhxz73hJPaEv7/cBha4pk0AgP.',
    'CRN8-67890',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO UPDATE
SET aceita_consultas_avulsas = TRUE,
    email_confirmado = TRUE;

UPDATE Nutricionista
SET aceita_consultas_avulsas = TRUE
WHERE email = 'nutri@nutri4you.com';

INSERT INTO Horario_Atendimento (id_nutricionista, dia_semana, horario)
SELECT n.id_nutricionista, grade.dia_semana, grade.horario
FROM Nutricionista n
CROSS JOIN (VALUES
    (1, TIME '08:30'), (1, TIME '10:00'), (1, TIME '14:30'),
    (2, TIME '09:00'), (2, TIME '13:30'), (2, TIME '16:00'),
    (3, TIME '08:30'), (3, TIME '11:00'), (3, TIME '15:15'),
    (4, TIME '09:45'), (4, TIME '14:00'), (4, TIME '17:00'),
    (5, TIME '08:30'), (5, TIME '10:45'), (5, TIME '15:30'),
    (6, TIME '09:00'), (6, TIME '12:00')
) AS grade(dia_semana, horario)
WHERE n.email = 'mariana@nutri4you.com'
ON CONFLICT (id_nutricionista, dia_semana, horario) DO NOTHING;
