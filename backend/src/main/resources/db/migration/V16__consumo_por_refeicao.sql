CREATE TABLE Consumo_Refeicao (
    id SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL REFERENCES Paciente(id_paciente),
    id_refeicao INT NOT NULL REFERENCES Refeicao(id_refeicao),
    data_registro DATE NOT NULL,
    consumida BOOLEAN NOT NULL,
    CONSTRAINT uq_consumo_refeicao UNIQUE (id_paciente, id_refeicao, data_registro)
);
CREATE INDEX idx_consumo_refeicao_data ON Consumo_Refeicao(id_paciente, data_registro);
