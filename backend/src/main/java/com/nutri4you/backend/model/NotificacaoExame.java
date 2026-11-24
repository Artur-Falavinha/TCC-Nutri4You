package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "notificacao_exame", uniqueConstraints =
        @UniqueConstraint(name = "uq_notificacao_exame_versao", columnNames = {"id_exame", "versao_exame", "tipo"}))
public class NotificacaoExame {
    public enum Tipo { SOLICITADO, RESULTADO_ENVIADO, PARECER_REGISTRADO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_exame", nullable = false)
    private Exame exame;

    @Column(nullable = false)
    private long versaoExame;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Tipo tipo;

    @Column(nullable = false)
    private Instant criadaEm;

    protected NotificacaoExame() {
    }

    public NotificacaoExame(Exame exame, Tipo tipo, Instant criadaEm) {
        this.exame = exame;
        this.versaoExame = exame.getVersao();
        this.tipo = tipo;
        this.criadaEm = criadaEm;
    }
}
