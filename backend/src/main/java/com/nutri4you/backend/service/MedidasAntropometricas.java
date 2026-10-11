package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.dto.AvaliacaoResponse;
import com.nutri4you.backend.model.AvaliacaoAntropometrica;
import java.math.BigDecimal;

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
        validarOpcional(request.pregaTricipital(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega tricipital deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaSubescapular(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega subescapular deve ficar entre 0,1 e 100 mm.");
        validarOpcional(request.pregaSuprailiaca(), new BigDecimal("0.1"), new BigDecimal("100"),
                "Prega supra-ilíaca deve ficar entre 0,1 e 100 mm.");
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

    static void aplicar(AvaliacaoAntropometrica avaliacao, AvaliacaoRequest request) {
        avaliacao.setPeso(request.peso());
        avaliacao.setAltura(request.altura());
        avaliacao.setImc(IndicadoresCorporais.imc(request.peso(), request.altura()));
        avaliacao.setPercentualGordura(request.percentualGordura());
        avaliacao.setMassaMuscularKg(request.massaMuscularKg());
        avaliacao.setPregaBicipital(request.pregaBicipital());
        avaliacao.setPregaTricipital(request.pregaTricipital());
        avaliacao.setPregaSubescapular(request.pregaSubescapular());
        avaliacao.setPregaSuprailiaca(request.pregaSuprailiaca());
        avaliacao.setCircunferenciaCintura(request.circunferenciaCintura());
        avaliacao.setCircunferenciaQuadril(request.circunferenciaQuadril());
        avaliacao.setCircunferenciaBraco(request.circunferenciaBraco());
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
                avaliacao.getMassaMuscularKg(),
                avaliacao.getPregaBicipital(),
                avaliacao.getPregaTricipital(),
                avaliacao.getPregaSubescapular(),
                avaliacao.getPregaSuprailiaca(),
                avaliacao.getCircunferenciaCintura(),
                avaliacao.getCircunferenciaQuadril(),
                avaliacao.getCircunferenciaBraco());
    }

}

