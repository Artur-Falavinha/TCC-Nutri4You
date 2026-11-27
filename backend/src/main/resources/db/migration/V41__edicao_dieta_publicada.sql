ALTER TABLE plano_alimentar
    ADD COLUMN id_plano_anterior INTEGER REFERENCES plano_alimentar(id_plano),
    ADD COLUMN substituida_em DATE,
    ADD CONSTRAINT uq_plano_anterior UNIQUE (id_plano_anterior);

ALTER TABLE notificacao_plano_alimentar
    ADD COLUMN edicao_agendada BOOLEAN NOT NULL DEFAULT FALSE;
