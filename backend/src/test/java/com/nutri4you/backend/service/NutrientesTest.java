package com.nutri4you.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

class NutrientesTest {
    @Test
    void proporcaoUsaGramasPorCemEArredondaApenasAoApresentar() {
        Nutrientes base =
                new Nutrientes(
                        new BigDecimal("128.456789"),
                        new BigDecimal("2.500000"),
                        new BigDecimal("28.100000"),
                        new BigDecimal("0.250000"));
        Nutrientes porcao = base.proporcional(new BigDecimal("33.33"));
        assertThat(porcao.kcal()).isEqualByComparingTo("42.8146477737");
        assertThat(porcao.arredondar().kcal()).isEqualByComparingTo("42.81");
        assertThat(porcao.somar(porcao).arredondar().kcal()).isEqualByComparingTo("85.63");
        assertThat(porcao.somar(porcao).arredondar().proteinas()).isEqualByComparingTo("1.67");
    }

    @Test
    void meiaUnidadeDaSegundaCasaArredondaParaCima() {
        Nutrientes minimo =
                new Nutrientes(
                        new BigDecimal("0.005"),
                        new BigDecimal("0.004"),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO);
        assertThat(minimo.arredondar().kcal()).isEqualByComparingTo("0.01");
        assertThat(minimo.arredondar().proteinas()).isEqualByComparingTo("0.00");
    }
    @Test
    void fibraDesconhecidaPermaneceNulaNaPorcaoENaSoma() {
        Nutrientes conhecido = new Nutrientes(BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE,
                BigDecimal.ONE, new BigDecimal("2.749333"));
        Nutrientes desconhecido = new Nutrientes(BigDecimal.ONE, BigDecimal.ONE,
                BigDecimal.ONE, BigDecimal.ONE);
        assertThat(desconhecido.proporcional(new BigDecimal("50")).arredondar().fibras()).isNull();
        assertThat(conhecido.somar(desconhecido).fibras()).isNull();
        assertThat(desconhecido.somar(conhecido).fibras()).isNull();
        assertThat(conhecido.proporcional(new BigDecimal("33.33")).somar(
                conhecido.proporcional(new BigDecimal("33.33"))).arredondar().fibras())
                .isEqualByComparingTo("1.83");
        assertThat(Nutrientes.zero().somar(conhecido).fibras()).isEqualByComparingTo("2.749333");
        assertThat(Nutrientes.zero().arredondar().fibras()).isEqualByComparingTo("0.00");
    }

}
