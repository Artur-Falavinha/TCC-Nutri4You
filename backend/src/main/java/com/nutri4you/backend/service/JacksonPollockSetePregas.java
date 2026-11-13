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

    record Resultado(BigDecimal percentualGordura, BigDecimal massaMagraKg,
                     BigDecimal massaGordaKg, BigDecimal somaPregas) {}

    private JacksonPollockSetePregas() {}

    static boolean temAlgumaPregaExclusivaDoMetodo(AvaliacaoRequest request) {
        return Arrays.asList(
                request.pregaPeitoral(),
                request.pregaAxilarMedia(),
                request.pregaAbdominal(),
                request.pregaCoxa())
                .stream()
                .anyMatch(valor -> valor != null);
    }

    static boolean temSetePregas(AvaliacaoRequest request) {
        return pregas(request).stream().allMatch(valor -> valor != null);
    }

    static Resultado calcular(Paciente paciente, LocalDate dataAvaliacao, AvaliacaoRequest request) {
        if (!temSetePregas(request)) {
            throw new IllegalArgumentException("Informe as sete pregas de Jackson-Pollock para calcular a composição corporal.");
        }
        if (paciente.getDataNascimento() == null || paciente.getSexo() == null) {
            throw new IllegalArgumentException("Data de nascimento e sexo do paciente são necessários para o método de Jackson-Pollock.");
        }
        long idade = ChronoUnit.YEARS.between(paciente.getDataNascimento(), dataAvaliacao);
        String sexo = paciente.getSexo().trim().toLowerCase(Locale.ROOT);
        boolean masculino = sexo.startsWith("m");
        boolean feminino = sexo.startsWith("f");
        if (!masculino && !feminino) {
            throw new IllegalArgumentException("O método de Jackson-Pollock exige sexo feminino ou masculino informado no cadastro.");
        }
        long idadeMaxima = masculino ? 61 : 55;
        if (idade < 18 || idade > idadeMaxima) {
            throw new IllegalArgumentException("O método de Jackson-Pollock 7 pregas é aplicado somente dentro da faixa etária validada para este sexo.");
        }

        BigDecimal soma = pregas(request).stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        double x = soma.doubleValue();
        double densidade = masculino
                ? 1.112 - 0.00043499 * x + 0.00000055 * x * x - 0.00028826 * idade
                : 1.097 - 0.00046971 * x + 0.00000056 * x * x - 0.00012828 * idade;
        double gordura = 495.0 / densidade - 450.0;
        if (!Double.isFinite(gordura) || gordura < 0 || gordura > 100) {
            throw new IllegalArgumentException("As sete pregas resultaram em uma composição corporal fora dos limites válidos.");
        }
        BigDecimal percentual = BigDecimal.valueOf(gordura).setScale(2, RoundingMode.HALF_UP);
        BigDecimal massaGorda = request.peso().multiply(percentual)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal massaMagra = request.peso().subtract(massaGorda).setScale(2, RoundingMode.HALF_UP);
        return new Resultado(percentual, massaMagra, massaGorda, soma.setScale(2, RoundingMode.HALF_UP));
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
