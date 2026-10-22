package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.CancelarConsultaRequest;
import com.nutri4you.backend.dto.ConsultaPacienteResponse;
import com.nutri4you.backend.dto.DisponibilidadeConsultaResponse;
import com.nutri4you.backend.dto.ReagendarConsultaRequest;
import com.nutri4you.backend.dto.SolicitarConsultaRequest;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.service.AgendaPacienteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agenda")
public class AgendaPacienteController {

    private final AgendaPacienteService service;

    public AgendaPacienteController(AgendaPacienteService service) {
        this.service = service;
    }

    @GetMapping("/consultas")
    public ApiResponse<List<ConsultaPacienteResponse>> listar(Authentication authentication) {
        return ApiResponse.ok(service.listar(paciente(authentication)), "Consultas carregadas.");
    }

    @GetMapping("/disponibilidade")
    public ApiResponse<DisponibilidadeConsultaResponse> disponibilidade(
            Authentication authentication,
            @RequestParam Integer nutricionistaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ApiResponse.ok(
                service.disponibilidade(paciente(authentication), nutricionistaId, data),
                "Horários disponíveis carregados.");
    }

    @PostMapping("/consultas")
    public ResponseEntity<ApiResponse<ConsultaPacienteResponse>> solicitar(
            Authentication authentication,
            @RequestBody SolicitarConsultaRequest request) {
        ConsultaPacienteResponse resposta = service.solicitar(paciente(authentication), request);
        return ResponseEntity.created(URI.create("/api/v1/agenda/consultas/" + resposta.id()))
                .body(ApiResponse.ok(resposta, "Solicitação de consulta registrada."));
    }

    @PutMapping("/consultas/{id}/reagendamento")
    public ApiResponse<ConsultaPacienteResponse> reagendar(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody ReagendarConsultaRequest request) {
        return ApiResponse.ok(
                service.reagendar(paciente(authentication), id, request),
                "Reagendamento solicitado.");
    }

    @PostMapping("/consultas/{id}/cancelamento")
    public ApiResponse<ConsultaPacienteResponse> cancelar(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody CancelarConsultaRequest request) {
        return ApiResponse.ok(
                service.cancelar(paciente(authentication), id, request == null ? null : request.versao()),
                "Consulta cancelada.");
    }

    private Paciente paciente(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Paciente paciente)) {
            throw new AcessoNegadoException("Acesso restrito a pacientes.");
        }
        return paciente;
    }
}
