-- Compatibility with local databases created before the authentication sprint.
ALTER TABLE Paciente ADD COLUMN IF NOT EXISTS email_confirmado BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS Token_Email (
    id_token SERIAL PRIMARY KEY,
    token UUID NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL,
    id_paciente INT NOT NULL REFERENCES Paciente(id_paciente),
    expira_em TIMESTAMP NOT NULL,
    usado_em TIMESTAMP
);
CREATE TABLE IF NOT EXISTS Relacao_Clinica (
    id_relacao SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL REFERENCES Paciente(id_paciente),
    id_nutricionista INT NOT NULL REFERENCES Nutricionista(id_nutricionista),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',
    iniciada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    encerrada_em TIMESTAMP,
    CONSTRAINT uq_rel_par UNIQUE (id_paciente, id_nutricionista)
);
DO $$
BEGIN
    IF to_regclass('public.vinculo_nutricional') IS NOT NULL THEN
        INSERT INTO Relacao_Clinica (id_paciente, id_nutricionista, status, iniciada_em, encerrada_em)
        SELECT DISTINCT ON (id_paciente, id_nutricionista)
            id_paciente, id_nutricionista,
            CASE WHEN status = 'ATIVO' AND data_fim IS NULL THEN 'ATIVA' ELSE 'ENCERRADA' END,
            data_inicio::timestamp, data_fim::timestamp
        FROM Vinculo_Nutricional
        ORDER BY id_paciente, id_nutricionista, data_inicio DESC, id_vinculo DESC
        ON CONFLICT (id_paciente, id_nutricionista) DO NOTHING;
    END IF;
END;
$$;
