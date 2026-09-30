package com.nutri4you.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Pergunta_Anamnese")
public class PerguntaAnamnese {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id_pergunta")
    public Integer id;
    @Column(unique = true, length = 80)
    public String codigo;
    @Column(length = 100)
    public String categoria;
    @Column(name = "texto_pergunta", nullable = false)
    public String texto;
    @Column(name = "tipo_resposta", length = 50)
    public String tipo;
    public Boolean ativo;
}
