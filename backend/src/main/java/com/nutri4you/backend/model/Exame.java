package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "Exame")
public class Exame {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id_exame") private Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_paciente", nullable = false) private Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_nutricionista", nullable = false) private Nutricionista nutricionista;
    @Column(name = "nome_exame", nullable = false, length = 150) private String nome;
    @Column(name = "descricao_exame", columnDefinition = "text") private String descricao;
    @Column(name = "data_solicitacao") private LocalDate dataSolicitacao;
    @Column(name = "data_envio") private LocalDate dataEnvio;
    @Column(length = 30) private String status = "PENDENTE";
    @Column private byte[] arquivo;
    @Column(name = "arquivo_nome", length = 150) private String arquivoNome;
    @Column(name = "arquivo_tipo", length = 100) private String arquivoTipo;
    @Column(name = "arquivo_tamanho") private Long arquivoTamanho;
    @Column(columnDefinition = "text") private String parecer;
    @Column(name = "analisado_em") private Instant analisadoEm;
    @Version @Column(nullable = false) private long versao;
    protected Exame() {}
    public Exame(Paciente paciente, Nutricionista nutricionista, String nome, String descricao, LocalDate data) {
        this.paciente = paciente; this.nutricionista = nutricionista; this.nome = nome;
        this.descricao = descricao; this.dataSolicitacao = data;
    }
    public void enviar(byte[] arquivo, String nome, String tipo, LocalDate data) {
        this.arquivo = arquivo; this.arquivoNome = nome; this.arquivoTipo = tipo;
        this.arquivoTamanho = (long) arquivo.length; this.dataEnvio = data; this.status = "ENVIADO";
    }
    public void analisar(String parecer, Instant agora) { this.parecer = parecer; this.analisadoEm = agora; this.status = "ANALISADO"; }
    public Integer getId() { return id; }
    public Paciente getPaciente() { return paciente; }
    public Nutricionista getNutricionista() { return nutricionista; }
    public String getNome() { return nome; }
    public String getDescricao() { return descricao; }
    public LocalDate getDataSolicitacao() { return dataSolicitacao; }
    public LocalDate getDataEnvio() { return dataEnvio; }
    public String getStatus() { return status; }
    public byte[] getArquivo() { return arquivo; }
    public String getArquivoNome() { return arquivoNome; }
    public String getArquivoTipo() { return arquivoTipo; }
    public Long getArquivoTamanho() { return arquivoTamanho; }
    public String getParecer() { return parecer; }
    public Instant getAnalisadoEm() { return analisadoEm; }
    public long getVersao() { return versao; }
}
