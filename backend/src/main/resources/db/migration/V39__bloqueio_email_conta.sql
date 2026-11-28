CREATE TABLE IF NOT EXISTS bloqueio_email_conta (
    id INTEGER PRIMARY KEY CHECK (id = 1)
);
INSERT INTO bloqueio_email_conta (id) VALUES (1) ON CONFLICT DO NOTHING;
