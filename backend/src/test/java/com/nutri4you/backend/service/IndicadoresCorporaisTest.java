package com.nutri4you.backend.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class IndicadoresCorporaisTest {

    @Test
    void imcDividePesoPelaAlturaAoQuadrado() {
        assertEquals(new BigDecimal("24.69"),
                IndicadoresCorporais.imc(new BigDecimal("80"), new BigDecimal("1.80")));
    }

    @Test
    void razaoCinturaQuadrilExigeAsDuasMedidas() {
        assertNull(IndicadoresCorporais.razaoCinturaQuadril(new BigDecimal("80"), null));
        assertEquals(new BigDecimal("0.80"),
                IndicadoresCorporais.razaoCinturaQuadril(new BigDecimal("80"), new BigDecimal("100")));
    }
}
