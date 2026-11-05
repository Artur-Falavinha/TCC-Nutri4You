CREATE TABLE Horario_Atendimento (
    id SERIAL PRIMARY KEY,
    id_nutricionista INT NOT NULL REFERENCES Nutricionista(id_nutricionista),
    dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    horario TIME NOT NULL CHECK (horario <= TIME '23:15'),
    UNIQUE (id_nutricionista, dia_semana, horario)
);

-- Preserve the previously offered schedule for existing professionals only.
-- New professionals explicitly configure availability; an empty schedule is closed.
INSERT INTO Horario_Atendimento (id_nutricionista, dia_semana, horario)
SELECT n.id_nutricionista, d, h
FROM Nutricionista n
CROSS JOIN generate_series(1, 6) d
CROSS JOIN unnest(ARRAY[TIME '08:00', TIME '09:00', TIME '09:30', TIME '10:15',
                       TIME '11:00', TIME '14:00', TIME '14:45', TIME '15:30']) h;
