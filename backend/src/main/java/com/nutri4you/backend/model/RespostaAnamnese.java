package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Resposta_Anamnese", uniqueConstraints =
    @UniqueConstraint(columnNames = {"id_paciente", "id_pergunta"}))
public class RespostaAnamnese {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id_resposta")
    public Integer id;
    @Column(name = "id_paciente", nullable = false)
    public Integer pacienteId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_pergunta")
    public PerguntaAnamnese pergunta;
    @Column(name = "texto_resposta", columnDefinition = "text")
    public String texto;
    @Column(name = "data_ultima_atualizacao")
    public LocalDateTime atualizadaEm;
}
