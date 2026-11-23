CREATE TABLE foto_perfil (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paciente_id INTEGER UNIQUE REFERENCES paciente (id_paciente) ON DELETE CASCADE,
    nutricionista_id INTEGER UNIQUE REFERENCES nutricionista (id_nutricionista) ON DELETE CASCADE,
    arquivo BYTEA NOT NULL,
    CONSTRAINT ck_foto_perfil_titular CHECK ((paciente_id IS NULL) <> (nutricionista_id IS NULL))
);
