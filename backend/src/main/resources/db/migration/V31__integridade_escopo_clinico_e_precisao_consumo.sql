-- Alinha o tipo físico à precisão usada pela entidade e pelas metas do plano alimentar.
ALTER TABLE Consumo_Diario
    ALTER COLUMN kcal_consumidas TYPE DECIMAL(8,2);

-- Chaves candidatas necessárias para FKs compostas que preservam o escopo da consulta.
ALTER TABLE Consulta
    ADD CONSTRAINT uq_consulta_paciente
        UNIQUE (id_consulta, id_paciente),
    ADD CONSTRAINT uq_consulta_escopo
        UNIQUE (id_consulta, id_paciente, id_nutricionista);

-- Uma avaliação vinculada deve pertencer ao mesmo paciente da consulta.
ALTER TABLE Avaliacao_Antropometrica
    DROP CONSTRAINT IF EXISTS fk_avaliacao_consulta,
    ADD CONSTRAINT fk_avaliacao_consulta_paciente
        FOREIGN KEY (id_consulta, id_paciente)
        REFERENCES Consulta (id_consulta, id_paciente);

-- Exames e planos mantêm paciente/nutricionista como autoria explícita, inclusive quando
-- não pertencem a uma consulta. Quando id_consulta existe, o escopo deve coincidir.
ALTER TABLE Exame
    DROP CONSTRAINT IF EXISTS fk_exame_consulta,
    ADD CONSTRAINT fk_exame_consulta_escopo
        FOREIGN KEY (id_consulta, id_paciente, id_nutricionista)
        REFERENCES Consulta (id_consulta, id_paciente, id_nutricionista);

ALTER TABLE Plano_Alimentar
    DROP CONSTRAINT IF EXISTS fk_plano_consulta,
    ADD CONSTRAINT fk_plano_consulta_escopo
        FOREIGN KEY (id_consulta, id_paciente, id_nutricionista)
        REFERENCES Consulta (id_consulta, id_paciente, id_nutricionista);
