package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.dto.AvaliacaoResponse;
import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import com.nutri4you.backend.model.Paciente;
import java.math.BigDecimal;
import java.math.RoundingMode;

final class MedidasAntropometricas {
    private MedidasAntropometricas() {}

    static void validarMedidas(AvaliacaoRequest request) {
        if (request == null || request.peso() == null || request.altura() == null) {
            throw new IllegalArgumentException("Peso e altura são obrigatórios.");
        }
        if (request.peso().compareTo(BigDecimal.ONE) < 0 || request.peso().compareTo(new BigDecimal("500")) > 0) {
            throw new IllegalArgumentException("Peso deve ficar entre 1 e 500 kg.");
        }
        if (request.altura().compareTo(new BigDecimal("0.30")) < 0
                || request.altura().compareTo(new BigDecimal("2.70")) > 0) {
            throw new IllegalArgumentException("Altura deve ficar entre 0,30 e 2,70 m.");
        }
        validarOpcional(request.percentualGordura(), BigDecimal.ZERO, new BigDecimal("100"),
                "Percentual de gordura deve ficar entre 0 e 100%.");
        validarOpcional(request.massaMuscularKg(), BigDecimal.ZERO, new BigDecimal("300"),
                "Massa muscular deve ficar entre 0 e 300 kg.");
        validarOpcional(request.pregaBicipital(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega bicipital deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaPeitoral(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega peitoral deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaAxilarMedia(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega axilar média deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaTricipital(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega tricipital deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaSubescapular(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega subescapular deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaAbdominal(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega abdominal deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaSuprailiaca(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega supra-ilíaca deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaCoxa(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega da coxa deve ficar entre 0,1 e 100 mm.");
        if (JacksonPollockSetePregas.temAlgumaPregaExclusivaDoMetodo(request)
                && !JacksonPollockSetePregas.temSetePregas(request)) {
            throw new IllegalArgumentException("Preencha as sete pregas de Jackson-Pollock ou deixe todas vazias.");
        }
        validarOpcional(request.circunferenciaCintura(), new BigDecimal("0.1"), new BigDecimal("300"),
                "Circunferência da cintura deve ficar entre 0,1 e 300 cm.");
        validarOpcional(request.circunferenciaQuadril(), new BigDecimal("0.1"), new BigDecimal("300"),
                "Circunferência do quadril deve ficar entre 0,1 e 300 cm.");
        validarOpcional(request.circunferenciaBraco(), new BigDecimal("0.1"), new BigDecimal("150"),
                "Circunferência do braço deve ficar entre 0,1 e 150 cm.");
    }

    static void validarOpcional(BigDecimal valor, BigDecimal minimo, BigDecimal maximo, String mensagem) {
        if (valor != null && (valor.compareTo(minimo) < 0 || valor.compareTo(maximo) > 0)) {
            throw new IllegalArgumentException(mensagem);
        }
    }

    static void aplicar(AvaliacaoAntropometrica avaliacao, AvaliacaoRequest request, Paciente paciente) {
        avaliacao.setPeso(request.peso());
        avaliacao.setAltura(request.altura());
        avaliacao.setImc(IndicadoresCorporais.imc(request.peso(), request.altura()));
        avaliacao.setMassaMuscularKg(request.massaMuscularKg());
        avaliacao.setPregaBicipital(request.pregaBicipital());
        avaliacao.setPregaPeitoral(request.pregaPeitoral());
        avaliacao.setPregaAxilarMedia(request.pregaAxilarMedia());
        avaliacao.setPregaTricipital(request.pregaTricipital());
        avaliacao.setPregaSubescapular(request.pregaSubescapular());
        avaliacao.setPregaAbdominal(request.pregaAbdominal());
        avaliacao.setPregaSuprailiaca(request.pregaSuprailiaca());
        avaliacao.setPregaCoxa(request.pregaCoxa());
        avaliacao.setCircunferenciaCintura(request.circunferenciaCintura());
        avaliacao.setCircunferenciaQuadril(request.circunferenciaQuadril());
        avaliacao.setCircunferenciaBraco(request.circunferenciaBraco());

        BigDecimal percentual = request.percentualGordura();
        String metodo = percentual == null ? null : "Informado manualmente";
        if (JacksonPollockSetePregas.temSetePregas(request)) {
            var resultado = JacksonPollockSetePregas.calcular(
                    paciente, avaliacao.getDataAvaliacao().toLocalDate(), request);
            percentual = resultado.percentualGordura();
            avaliacao.setMassaMagraKg(resultado.massaMagraKg());
            avaliacao.setMassaGordaKg(resultado.massaGordaKg());
            metodo = JacksonPollockSetePregas.METODO;
        } else if (percentual != null) {
            BigDecimal massaGorda = request.peso().multiply(percentual)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            avaliacao.setMassaGordaKg(massaGorda);
            avaliacao.setMassaMagraKg(request.peso().subtract(massaGorda).setScale(2, RoundingMode.HALF_UP));
        } else {
            avaliacao.setMassaMagraKg(null);
            avaliacao.setMassaGordaKg(null);
        }
        avaliacao.setPercentualGordura(percentual);
        avaliacao.setMetodoPercentualGordura(metodo);
    }

    static AvaliacaoResponse paraResposta(AvaliacaoAntropometrica avaliacao) {
        return new AvaliacaoResponse(
                avaliacao.getId(),
                avaliacao.getDataAvaliacao(),
                avaliacao.getPeso(),
                avaliacao.getAltura(),
                avaliacao.getImc(),
                IndicadoresCorporais.razaoCinturaQuadril(
                        avaliacao.getCircunferenciaCintura(), avaliacao.getCircunferenciaQuadril()),
                avaliacao.getPercentualGordura(),
                avaliacao.getMassaMagraKg(),
                avaliacao.getMassaGordaKg(),
                avaliacao.getMassaMuscularKg(),
                avaliacao.getPregaBicipital(),
                avaliacao.getPregaPeitoral(),
                avaliacao.getPregaAxilarMedia(),
                avaliacao.getPregaTricipital(),
                avaliacao.getPregaSubescapular(),
                avaliacao.getPregaAbdominal(),
                avaliacao.getPregaSuprailiaca(),
                avaliacao.getPregaCoxa(),
                somaSetePregas(avaliacao),
                avaliacao.getMetodoPercentualGordura(),
                avaliacao.getCircunferenciaCintura(),
                avaliacao.getCircunferenciaQuadril(),
                avaliacao.getCircunferenciaBraco());
    }

    private static BigDecimal somaSetePregas(AvaliacaoAntropometrica avaliacao) {
        BigDecimal[] pregas = { avaliacao.getPregaPeitoral(), avaliacao.getPregaAxilarMedia(),
                avaliacao.getPregaTricipital(), avaliacao.getPregaSubescapular(),
                avaliacao.getPregaAbdominal(), avaliacao.getPregaSuprailiaca(), avaliacao.getPregaCoxa() };
        BigDecimal soma = BigDecimal.ZERO;
        for (BigDecimal prega : pregas) {
            if (prega == null) return null;
            soma = soma.add(prega);
        }
        return soma.setScale(2, RoundingMode.HALF_UP);
    }

}

