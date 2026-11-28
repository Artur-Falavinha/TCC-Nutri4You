ALTER TABLE Plano_Alimentar DROP CONSTRAINT chk_plano_status;
ALTER TABLE Plano_Alimentar ADD CONSTRAINT chk_plano_status
    CHECK (status IN ('RASCUNHO', 'PUBLICADO', 'SUBSTITUIDO', 'EXCLUIDO'));

ALTER TABLE Plano_Alimentar DROP CONSTRAINT plano_alimentar_id_consulta_key;
CREATE UNIQUE INDEX uq_plano_visivel_consulta ON Plano_Alimentar (id_consulta)
    WHERE id_consulta IS NOT NULL AND status <> 'EXCLUIDO';
