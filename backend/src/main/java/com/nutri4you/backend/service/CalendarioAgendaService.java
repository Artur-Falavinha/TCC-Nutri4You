package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.HorarioAtendimentoDTO;
import com.nutri4you.backend.dto.SemanaAgendaDTO;
import com.nutri4you.backend.dto.SemanaAgendaDTO.Compromisso;
import com.nutri4you.backend.dto.SemanaAgendaDTO.Dia;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CalendarioAgendaService {
    private final ConsultaRepository consultas;
    private final HorarioAtendimentoService horarios;
    private final Clock clock;

    public CalendarioAgendaService(ConsultaRepository consultas, HorarioAtendimentoService horarios, Clock clock) {
        this.consultas = consultas;
        this.horarios = horarios;
        this.clock = clock;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public SemanaAgendaDTO carregar(Nutricionista nutricionista, LocalDate data) {
        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDate hoje = agora.toLocalDate();
        LocalDate inicio = (data == null ? hoje : data).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate fim = inicio.plusWeeks(1);
        List<Consulta> ocupadas = consultas.listarOcupadas(nutricionista.getId(),
                inicio.atStartOfDay().minusMinutes(Consulta.DURACAO_MINUTOS), fim.atStartOfDay());
        List<Consulta> visiveis = consultas.listarVisiveisNoPainel(nutricionista.getId(),
                inicio.atStartOfDay(), fim.atStartOfDay(), StatusRelacaoClinica.ATIVA);
        Map<LocalDate, List<Compromisso>> compromissos = agruparCompromissos(ocupadas, visiveis);
        Map<Integer, List<HorarioAtendimentoDTO>> disponibilidade = horarios.listar(nutricionista).stream()
                .collect(Collectors.groupingBy(HorarioAtendimentoDTO::diaSemana));

        List<Dia> dias = inicio.datesUntil(fim)
                .map(dia -> montarDia(dia, agora, disponibilidade.getOrDefault(dia.getDayOfWeek().getValue(), List.of()),
                        ocupadas, compromissos.getOrDefault(dia, List.of())))
                .toList();
        return new SemanaAgendaDTO(inicio, hoje, Consulta.DURACAO_MINUTOS, dias);
    }

    private Map<LocalDate, List<Compromisso>> agruparCompromissos(List<Consulta> ocupadas, List<Consulta> visiveis) {
        Map<Integer, Compromisso> porId = new HashMap<>();
        ocupadas.forEach(consulta -> porId.put(consulta.getId(), compromisso(consulta, null)));
        visiveis.forEach(consulta -> porId.put(consulta.getId(), compromisso(consulta, consulta.getPaciente().getNome())));

        return porId.values().stream()
                .sorted(Comparator.comparing(Compromisso::dataHora).thenComparing(Compromisso::id))
                .collect(Collectors.groupingBy(compromisso -> compromisso.dataHora().toLocalDate()));
    }

    private Compromisso compromisso(Consulta consulta, String pacienteNome) {
        boolean emAtendimento = "CONFIRMADA".equals(consulta.getStatus()) && consulta.getIniciadaEm() != null;
        return new Compromisso(consulta.getId(), consulta.getDataHora(), consulta.getStatus(), pacienteNome, emAtendimento);
    }

    private Dia montarDia(LocalDate data, LocalDateTime agora, List<HorarioAtendimentoDTO> disponibilidade,
                          List<Consulta> ocupadas, List<Compromisso> compromissos) {
        List<LocalTime> livres = disponibilidade.stream()
                .map(horario -> data.atTime(horario.horario()))
                .filter(inicio -> inicio.isAfter(agora))
                .filter(inicio -> ocupadas.stream().noneMatch(consulta -> consulta.sobrepoe(inicio)))
                .map(LocalDateTime::toLocalTime)
                .toList();
        return new Dia(data, !disponibilidade.isEmpty(), livres, compromissos);
    }
}
