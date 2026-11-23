-- As contas anteriores à confirmação mantêm o acesso que já tinham.
ALTER TABLE Nutricionista ADD COLUMN email_confirmado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE Nutricionista ALTER COLUMN email_confirmado SET DEFAULT FALSE;
