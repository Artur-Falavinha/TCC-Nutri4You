package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.HorarioAtendimentoDTO;
import com.nutri4you.backend.model.HorarioAtendimento;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.repository.HorarioAtendimentoRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;

@Service
public class HorarioAtendimentoService {
    public static final int DURACAO_MINUTOS = 45;
    private final HorarioAtendimentoRepository horarios;
    private final NutricionistaRepository nutricionistas;

    public HorarioAtendimentoService(HorarioAtendimentoRepository horarios, NutricionistaRepository nutricionistas) {
        this.horarios = horarios;
        this.nutricionistas = nutricionistas;
    }

    @Transactional(readOnly = true)
    public List<HorarioAtendimentoDTO> listar(Nutricionista nutri) {
        return horarios.findByNutricionista_IdOrderByDiaSemanaAscHorarioAsc(nutri.getId()).stream()
                .map(h -> new HorarioAtendimentoDTO(h.getDiaSemana(), h.getHorario())).toList();
    }

    @Transactional
    public List<HorarioAtendimentoDTO> salvar(Nutricionista nutri, List<HorarioAtendimentoDTO> entrada) {
        if (entrada == null || entrada.size() > 224) throw new IllegalArgumentException("Informe até 224 horários semanais.");
        var unicos = new HashSet<HorarioAtendimentoDTO>();
        for (var h : entrada) {
            if (h == null || h.diaSemana() == null || h.diaSemana() < 1 || h.diaSemana() > 7
                    || h.horario() == null || h.horario().getSecond() != 0 || h.horario().getNano() != 0
                    || h.horario().isAfter(LocalTime.of(23, 15))) {
                throw new IllegalArgumentException("Informe dia de 1 a 7 e horário em minutos, até 23:15.");
            }
            if (!unicos.add(h)) throw new IllegalArgumentException("Há horários repetidos.");
        }
        // Same lock as reservations: changing the schedule cannot race a booking.
        nutricionistas.findByIdForUpdate(nutri.getId()).orElseThrow();
        horarios.deleteByNutricionista_Id(nutri.getId());
        horarios.flush();
        horarios.saveAll(entrada.stream().map(h -> new HorarioAtendimento(nutri, h.diaSemana(), h.horario())).toList());
        horarios.flush();
        return listar(nutri);
    }

    @Transactional(readOnly = true)
    public List<LocalTime> horarios(Integer nutricionistaId, int diaSemana) {
        return horarios.findByNutricionista_IdAndDiaSemanaOrderByHorarioAsc(nutricionistaId, diaSemana)
                .stream().map(HorarioAtendimento::getHorario).toList();
    }

    public void exigirDisponivel(Integer nutricionistaId, LocalDateTime dataHora) {
        if (!horarios(nutricionistaId, dataHora.getDayOfWeek().getValue()).contains(dataHora.toLocalTime())) {
            throw new IllegalArgumentException("O horário escolhido não está disponível na agenda do nutricionista.");
        }
    }
}
