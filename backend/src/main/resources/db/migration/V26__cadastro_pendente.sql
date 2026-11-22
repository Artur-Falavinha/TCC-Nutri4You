CREATE TABLE cadastro_pendente (
    email VARCHAR(100) PRIMARY KEY,
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('PACIENTE', 'NUTRICIONISTA')),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    enviado_em TIMESTAMPTZ NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    confirmado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cadastro_pendente_expira_em ON cadastro_pendente (expira_em);
