-- Upgrade both Flyway-created and legacy databases without changing V1/V1.1.
ALTER TABLE Token_Email ALTER COLUMN id_paciente DROP NOT NULL;
ALTER TABLE Token_Email ADD COLUMN IF NOT EXISTS id_nutricionista INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'Token_Email'::regclass
          AND conname = 'fk_token_nutricionista'
    ) THEN
        ALTER TABLE Token_Email ADD CONSTRAINT fk_token_nutricionista
            FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'Token_Email'::regclass
          AND conname = 'chk_token_titular'
    ) THEN
        ALTER TABLE Token_Email ADD CONSTRAINT chk_token_titular CHECK (
            (id_paciente IS NOT NULL AND id_nutricionista IS NULL)
            OR (id_paciente IS NULL AND id_nutricionista IS NOT NULL)
        );
    END IF;
END;
$$;
