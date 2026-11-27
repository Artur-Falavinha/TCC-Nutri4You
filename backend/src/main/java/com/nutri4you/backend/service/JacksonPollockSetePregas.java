package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.model.Paciente;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

final class JacksonPollockSetePregas {
    static final String METODO = "Jackson-Pollock 7 pregas + Siri";

    private JacksonPollockSetePregas() {}

    static boolean temSetePregas(AvaliacaoRequest request) {
        return pregas(request).stream().allMatch(valor -> valor != null);
    }

    static BigDecimal calcularPercentual(Paciente paciente, LocalDate dataAvaliacao, AvaliacaoRequest request) {
        LocalDate nascimento = paciente.getDataNascimento();
        if (!temSetePregas(request) || nascimento == null || nascimento.isAfter(dataAvaliacao)
                || paciente.getSexo() == null) {
            return null;
        }
        String sexo = paciente.getSexo().trim().toLowerCase(Locale.ROOT);
        boolean masculino = sexo.equals("masculino") || sexo.equals("m");
        boolean feminino = sexo.equals("feminino") || sexo.equals("f");
        long idade = ChronoUnit.YEARS.between(nascimento, dataAvaliacao);
        if ((!masculino && !feminino) || idade < 18 || idade > (masculino ? 61 : 55)) {
            return null;
        }

        BigDecimal soma = pregas(request).stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        double x = soma.doubleValue();
        double densidade = masculino
                ? 1.112 - 0.00043499 * x + 0.00000055 * x * x - 0.00028826 * idade
                : 1.097 - 0.00046971 * x + 0.00000056 * x * x - 0.00012828 * idade;
        double gordura = 495.0 / densidade - 450.0;
        if (!Double.isFinite(gordura) || gordura <= 0 || gordura >= 100) {
            return null;
        }
        BigDecimal percentual = BigDecimal.valueOf(gordura).setScale(2, RoundingMode.HALF_UP);
        return MedidasAntropometricas.percentualValido(percentual) ? percentual : null;
    }

    static List<BigDecimal> pregas(AvaliacaoRequest request) {
        return Arrays.asList(
                request.pregaPeitoral(),
                request.pregaAxilarMedia(),
                request.pregaTricipital(),
                request.pregaSubescapular(),
                request.pregaAbdominal(),
                request.pregaSuprailiaca(),
                request.pregaCoxa());
    }
}
