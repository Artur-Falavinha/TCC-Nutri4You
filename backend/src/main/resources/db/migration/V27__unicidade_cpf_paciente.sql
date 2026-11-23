ALTER TABLE paciente ADD COLUMN cpf_original_conflitante VARCHAR(14);

-- Uma linha por grupo reserva o CPF. O original em todas as linhas impede a busca por um CPF ambíguo.
WITH cpfs_legados AS (
    SELECT id_paciente, NULLIF(regexp_replace(cpf, '[^0-9]', '', 'g'), '') AS cpf_digitos
    FROM paciente
    WHERE cpf IS NOT NULL
), cpfs_classificados AS (
    SELECT id_paciente,
           ROW_NUMBER() OVER (PARTITION BY cpf_digitos ORDER BY id_paciente) AS ordem,
           COUNT(*) OVER (PARTITION BY cpf_digitos) AS quantidade
    FROM cpfs_legados
    WHERE cpf_digitos IS NOT NULL
)
UPDATE paciente
SET cpf_original_conflitante = paciente.cpf,
    cpf = CASE WHEN cpfs_classificados.ordem = 1 THEN paciente.cpf END
FROM cpfs_classificados
WHERE paciente.id_paciente = cpfs_classificados.id_paciente
  AND cpfs_classificados.quantidade > 1;

UPDATE paciente
SET cpf = NULLIF(regexp_replace(cpf, '[^0-9]', '', 'g'), '')
WHERE cpf ~ '[^0-9]' OR cpf = '';

ALTER TABLE paciente RENAME CONSTRAINT paciente_cpf_key TO uq_paciente_cpf;
ALTER TABLE paciente ADD CONSTRAINT ck_paciente_cpf_digitos CHECK (cpf ~ '^[0-9]+$');
