package com.nutri4you.backend.model;

import com.nutri4you.backend.dto.PrescricaoDTO.AlimentoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "Alimento")
public class Alimento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_alimento")
    private Integer id;

    @Column(name = "codigo_taco", unique = true)
    private Integer codigoTaco;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 100)
    private String categoria;

    @Column(name = "nome_busca", length = 150)
    private String nomeBusca;

    @Column(name = "kcal_100g", precision = 12, scale = 6)
    private BigDecimal kcal100g;

    @Column(name = "proteina_100g", precision = 12, scale = 6)
    private BigDecimal proteina100g;

    @Column(name = "carboidratos_100g", precision = 12, scale = 6)
    private BigDecimal carboidratos100g;

    @Column(name = "gordura_100g", precision = 12, scale = 6)
    private BigDecimal gordura100g;

    @Column(name = "fibra_100g", precision = 12, scale = 6)
    private BigDecimal fibra100g;

    @Column(length = 240)
    private String fonte;

    @Column(name = "versao_fonte", length = 40)
    private String versaoFonte;

    @Column(name = "observacao_fonte", length = 500)
    private String observacaoFonte;

    @Column(name = "disponivel_prescricao", nullable = false)
    private boolean disponivelPrescricao;

    @Column(name = "catalogo_ativo")
    private boolean catalogoAtivo;

    protected Alimento() {}

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getCategoria() {
        return categoria;
    }

    public boolean calculavel() {
        return catalogoAtivo
                && disponivelPrescricao
                && kcal100g != null
                && proteina100g != null
                && carboidratos100g != null
                && gordura100g != null;
    }

    public Nutrientes nutrientes() {
        return new Nutrientes(kcal100g, proteina100g, carboidratos100g, gordura100g, fibra100g);
    }

    public AlimentoDTO paraResposta() {
        return new AlimentoDTO(
                id,
                codigoTaco,
                nome,
                categoria,
                kcal100g,
                proteina100g,
                carboidratos100g,
                gordura100g,
                fibra100g,
                fonte,
                versaoFonte,
                observacaoFonte,
                calculavel());
    }
}
