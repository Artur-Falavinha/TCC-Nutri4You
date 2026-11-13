package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.DecisaoConsultaRequest;
import com.nutri4you.backend.dto.HorarioAtendimentoDTO;
import com.nutri4you.backend.dto.PreferenciaAgendaDTO;
import com.nutri4you.backend.dto.SolicitacaoAvulsaDTO;
import com.nutri4you.backend.dto.NotificacaoConsultaDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.service.ConsultaService;
import com.nutri4you.backend.service.HorarioAtendimentoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agenda-nutricionista")
public class AgendaNutricionistaController {
    private final HorarioAtendimentoService horarios;
    private final ConsultaService consultas;

    public AgendaNutricionistaController(HorarioAtendimentoService horarios, ConsultaService consultas) {
        this.horarios = horarios;
        this.consultas = consultas;
    }

    @GetMapping("/horarios")
    public ApiResponse<List<HorarioAtendimentoDTO>> listarHorarios(Authentication auth) {
        return ApiResponse.ok(horarios.listar(nutricionista(auth)), "Horários carregados.");
    }

    @PutMapping("/horarios")
    public ApiResponse<List<HorarioAtendimentoDTO>> salvarHorarios(
            Authentication auth, @RequestBody List<HorarioAtendimentoDTO> entrada) {
        return ApiResponse.ok(horarios.salvar(nutricionista(auth), entrada), "Horários salvos.");
    }

    @GetMapping("/preferencias")
    public ApiResponse<PreferenciaAgendaDTO> preferencia(Authentication auth) {
        return ApiResponse.ok(horarios.preferencia(nutricionista(auth)), "Preferência carregada.");
    }

    @PutMapping("/preferencias")
    public ApiResponse<PreferenciaAgendaDTO> salvarPreferencia(
            Authentication auth, @RequestBody PreferenciaAgendaDTO preferencia) {
        return ApiResponse.ok(horarios.salvarPreferencia(nutricionista(auth), preferencia), "Preferência salva.");
    }

    @GetMapping("/solicitacoes-avulsas")
    public ApiResponse<List<SolicitacaoAvulsaDTO>> listarAvulsas(Authentication auth) {
        return ApiResponse.ok(consultas.listarAvulsasPendentes(nutricionista(auth)), "Solicitações carregadas.");
    }

    @GetMapping("/notificacoes")
    public ApiResponse<List<NotificacaoConsultaDTO>> listarNotificacoes(Authentication auth) {
        return ApiResponse.ok(consultas.listarNotificacoes(nutricionista(auth)), "Notificações carregadas.");
    }

    @PostMapping("/notificacoes/{id}/decisao")
    public ApiResponse<Void> decidirNotificacao(
            Authentication auth, @PathVariable Integer id, @RequestBody DecisaoConsultaRequest decisao) {
        consultas.decidirNotificacao(nutricionista(auth), id, decisao);
        return ApiResponse.ok(null, Boolean.TRUE.equals(decisao.aceitar()) ? "Consulta confirmada." : "Consulta recusada.");
    }

    @PostMapping("/solicitacoes-avulsas/{id}/decisao")
    public ApiResponse<Void> decidirAvulsa(
            Authentication auth, @PathVariable Integer id, @RequestBody DecisaoConsultaRequest decisao) {
        consultas.decidirAvulsa(nutricionista(auth), id, decisao);
        return ApiResponse.ok(null, Boolean.TRUE.equals(decisao.aceitar()) ? "Consulta confirmada." : "Consulta recusada.");
    }

    private Nutricionista nutricionista(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Nutricionista n)) {
            throw new AcessoNegadoException("Acesso restrito a nutricionistas.");
        }
        return n;
    }
}
