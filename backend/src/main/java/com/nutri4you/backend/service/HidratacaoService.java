package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.HidratacaoDTO;
import com.nutri4you.backend.model.ConsumoDiario;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.ConsumoDiarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class HidratacaoService {
    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");
    private static final int META_ML = 2500;
    private final ConsumoDiarioRepository consumos;

    private final EntityManager entityManager;

    public HidratacaoService(ConsumoDiarioRepository consumos, EntityManager entityManager) {
        this.consumos = consumos;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public HidratacaoDTO hoje(Paciente paciente) {
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        int consumido = consumos.findByPaciente_IdAndDataRegistro(paciente.getId(), hoje)
                .map(ConsumoDiario::getAguaMlConsumida).orElse(0);
        return new HidratacaoDTO(hoje, consumido, META_ML);
    }

    @Transactional
    public HidratacaoDTO adicionar(Paciente paciente, Integer quantidadeMl) {
        if (quantidadeMl == null || quantidadeMl <= 0 || quantidadeMl > 1000) {
            throw new IllegalArgumentException("Informe uma quantidade de água entre 1 e 1000 ml.");
        }
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        Paciente titular = entityManager.find(Paciente.class, paciente.getId(), LockModeType.PESSIMISTIC_WRITE);
        ConsumoDiario consumo = consumos.findByPaciente_IdAndDataRegistro(titular.getId(), hoje)
                .orElseGet(() -> new ConsumoDiario(
                        titular, hoje, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, BigDecimal.ZERO, 0));
        consumo.adicionarAgua(quantidadeMl);
        ConsumoDiario salvo = consumos.save(consumo);
        return new HidratacaoDTO(hoje, salvo.getAguaMlConsumida(), META_ML);
    }
}
