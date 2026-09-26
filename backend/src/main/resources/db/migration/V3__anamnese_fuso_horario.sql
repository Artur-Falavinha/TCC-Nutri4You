-- Legacy timestamps were written in UTC. Already-zoned values (init.sql)
-- must retain their instant, regardless of the connection's timezone.
DO $$
DECLARE
    column_name_to_convert TEXT;
BEGIN
    FOR column_name_to_convert IN
        SELECT attname
        FROM pg_attribute
        WHERE attrelid = 'Anamnese'::regclass
          AND attname IN ('finalizada_em', 'atualizada_em')
          AND atttypid = 'timestamp without time zone'::regtype
          AND NOT attisdropped
    LOOP
        EXECUTE format(
            'ALTER TABLE Anamnese ALTER COLUMN %I TYPE TIMESTAMPTZ USING %I AT TIME ZONE ''UTC''',
            column_name_to_convert, column_name_to_convert
        );
    END LOOP;
END;
$$;
