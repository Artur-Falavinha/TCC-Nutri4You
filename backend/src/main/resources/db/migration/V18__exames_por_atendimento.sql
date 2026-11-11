ALTER TABLE Exame
    ADD COLUMN id_consulta INTEGER,
    ADD CONSTRAINT fk_exame_consulta FOREIGN KEY (id_consulta) REFERENCES Consulta (id_consulta);

CREATE INDEX idx_exame_consulta ON Exame (id_consulta, id_exame);
