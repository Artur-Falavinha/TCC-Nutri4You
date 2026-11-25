package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "alteracao_email_pendente")
public class AlteracaoEmailPendente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_paciente", unique = true)
    private Integer pacienteId;

    @Column(name = "id_nutricionista", unique = true)
    private Integer nutricionistaId;

    @Column(name = "novo_email", nullable = false, length = 100)
    private String novoEmail;

    @Column(name = "codigo_hash", nullable = false, length = 64)
    private String codigoHash;

    @Column(name = "versao_credencial", nullable = false)
    private int versaoCredencial;

    @Column(name = "enviado_em", nullable = false)
    private Instant enviadoEm;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    protected AlteracaoEmailPendente() {
    }

    public AlteracaoEmailPendente(ContaAutenticavel conta) {
        if (conta.getTipoCadastro() == TipoCadastro.PACIENTE) {
            pacienteId = conta.getId();
        } else {
            nutricionistaId = conta.getId();
        }
    }

    public void emitir(String email, String hash, int versao, Instant agora, Instant validade) {
        novoEmail = email;
        codigoHash = hash;
        versaoCredencial = versao;
        enviadoEm = agora;
        expiraEm = validade;
    }

    public boolean valida(String hash, int versao, Instant agora) {
        return agora.isBefore(expiraEm) && versaoCredencial == versao && codigoHash.equals(hash);
    }

    public String getNovoEmail() {
        return novoEmail;
    }

    public Instant getEnviadoEm() {
        return enviadoEm;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }
}
