package com.nutri4you.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class IndicadoresCorporais {

    private IndicadoresCorporais() {
    }

    public static BigDecimal imc(BigDecimal pesoKg, BigDecimal alturaMetros) {
        if (pesoKg == null || alturaMetros == null || alturaMetros.signum() == 0) {
            return null;
        }
        return pesoKg.divide(alturaMetros.multiply(alturaMetros), 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal razaoCinturaQuadril(BigDecimal cintura, BigDecimal quadril) {
        if (cintura == null || quadril == null || quadril.signum() == 0) {
            return null;
        }
        return cintura.divide(quadril, 2, RoundingMode.HALF_UP);
    }
}
