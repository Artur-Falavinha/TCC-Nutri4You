package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.AnamneseConflictException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AnamneseService {
    private final GestaoPacienteService patients;
    private final AnamneseRepository records;
    private final PerguntaAnamneseRepository questions;
    private final RespostaAnamneseRepository answers;
    private final AnamneseCatalog catalog;
    private final ObjectMapper mapper;
    private final EntityManager entityManager;

    public AnamneseService(GestaoPacienteService patients, AnamneseRepository records,
        PerguntaAnamneseRepository questions, RespostaAnamneseRepository answers,
        AnamneseCatalog catalog, ObjectMapper mapper, EntityManager entityManager) {
        this.patients = patients;
        this.records = records;
        this.questions = questions;
        this.answers = answers;
        this.catalog = catalog;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public AnamneseResponse get(Nutricionista nutritionist, Integer patientId) {
        var patient = patients.buscarPorId(nutritionist, patientId);
        return response(patient, records.findById(patientId).orElse(null));
    }

    @Transactional
    public AnamneseResponse save(Nutricionista nutritionist, Integer patientId,
                                AnamneseRequest request, boolean finalize) {
        var patient = patients.buscarPorId(nutritionist, patientId);
        if (request == null) throw new IllegalArgumentException("Informe os dados da anamnese.");
        var clean = catalog.validate(request.respostas(), finalize);
        // Lock the patient too: concurrent first saves must not create duplicate records.
        entityManager.find(Paciente.class, patientId, LockModeType.PESSIMISTIC_WRITE);
        var record = records.findById(patientId).orElse(null);
        checkVersion(record, request.versao());
        if (record == null) {
            record = new Anamnese();
            record.pacienteId = patientId;
        }
        record.nutricionistaId = nutritionist.getId();
        record.atualizadaEm = Instant.now();
        if (finalize) {
            persistAnswers(patientId, clean, record.atualizadaEm);
            record.finalizadaEm = record.atualizadaEm;
            record.rascunho = null;
        } else {
            record.rascunho = mapper.writeValueAsString(clean);
        }
        record = records.saveAndFlush(record);
        return response(patient, record);
    }

    @Transactional
    public AnamneseResponse discard(Nutricionista nutritionist, Integer patientId, Long version) {
        var patient = patients.buscarPorId(nutritionist, patientId);
        entityManager.find(Paciente.class, patientId, LockModeType.PESSIMISTIC_WRITE);
        var record = records.findById(patientId).orElse(null);
        checkVersion(record, version);
        if (record != null) {
            record.rascunho = null;
            record.atualizadaEm = Instant.now();
            record.nutricionistaId = nutritionist.getId();
            records.flush();
        }
        return response(patient, record);
    }

    private void checkVersion(Anamnese record, Long version) {
        if (!Objects.equals(record == null ? null : record.versao, version))
            throw new AnamneseConflictException();
    }

    private void persistAnswers(Integer patientId, Map<String, Object> clean, Instant now) {
        var questionMap = questions.findByCodigoIsNotNull().stream()
            .collect(Collectors.toMap(q -> q.codigo, Function.identity()));
        var existing = answers.findByPacienteId(patientId).stream()
            .filter(a -> a.pergunta.codigo != null)
            .collect(Collectors.toMap(a -> a.pergunta.codigo, Function.identity()));
        for (var field : catalog.fields()) {
            var answer = existing.get(field.key());
            if (!clean.containsKey(field.key())) {
                if (answer != null) answers.delete(answer);
                continue;
            }
            var question = questionMap.get(field.key());
            if (question == null || !Boolean.TRUE.equals(question.ativo))
                throw new IllegalStateException("Catálogo de anamnese não foi migrado: " + field.key());
            if (answer == null) {
                answer = new RespostaAnamnese();
                answer.pacienteId = patientId;
                answer.pergunta = question;
            }
            answer.texto = mapper.writeValueAsString(clean.get(field.key()));
            answer.atualizadaEm = LocalDateTime.ofInstant(now, ZoneOffset.UTC);
            answers.save(answer);
        }
        answers.flush();
    }

    private AnamneseResponse response(PacienteResponseDTO patient, Anamnese record) {
        Map<String, Object> published = new LinkedHashMap<>();
        for (var answer : answers.findByPacienteId(patient.id())) {
            if (answer.pergunta.codigo != null)
                published.put(answer.pergunta.codigo, mapper.readValue(answer.texto, Object.class));
        }
        Map<String, Object> draft = record == null || record.rascunho == null ? null :
            mapper.readValue(record.rascunho, new TypeReference<Map<String, Object>>() {});
        String status = draft != null ? "RASCUNHO" :
            record != null && record.finalizadaEm != null ? "FINALIZADA" : "NAO_INICIADA";
        return new AnamneseResponse(patient, record == null ? null : record.versao, status,
            published, draft, record == null ? null : record.finalizadaEm,
            record == null ? null : record.atualizadaEm);
    }
}
