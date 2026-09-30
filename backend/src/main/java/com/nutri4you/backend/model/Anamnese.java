package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "Anamnese")
public class Anamnese {
    @Id @Column(name = "id_paciente")
    public Integer pacienteId;
    @Version @Column(name = "versao", nullable = false)
    public Long versao;
    @Column(columnDefinition = "text")
    public String rascunho;
    @Column(name = "finalizada_em")
    public Instant finalizadaEm;
    @Column(name = "atualizada_em", nullable = false)
    public Instant atualizadaEm;
    @Column(name = "id_nutricionista", nullable = false)
    public Integer nutricionistaId;
}
