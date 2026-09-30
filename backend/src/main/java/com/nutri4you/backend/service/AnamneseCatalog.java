package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AnamneseValidationException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@Component
public class AnamneseCatalog {
    public record Condition(String key, List<String> values) {}
    public record Field(String key, String section, String label, String type, boolean required,
                        Integer maxLength, BigDecimal min, BigDecimal max, BigDecimal step,
                        String pattern, List<String> options, String exclusive, Condition when,
                        String image, String imageAlt) {}
    private final List<Field> fields;
    public AnamneseCatalog(ObjectMapper mapper) throws IOException {
        try (var stream = new ClassPathResource("anamnese-fields.json").getInputStream()) {
            fields = List.of(mapper.readValue(stream, Field[].class));
        }
    }
    public List<Field> fields() { return fields; }

    public boolean visible(Field field, Map<String, Object> values) {
        if (field.when() == null) return true;
        var parent = fields.stream().filter(f -> f.key().equals(field.when().key())).findFirst().orElseThrow();
        if (!visible(parent, values)) return false;
        Object answer = values.get(parent.key());
        return answer instanceof List<?> list
            ? list.stream().anyMatch(field.when().values()::contains)
            : field.when().values().contains(answer);
    }

    public Map<String, Object> validate(Map<String, Object> input, boolean finalize) {
        if (input == null || input.size() > fields.size())
            throw new IllegalArgumentException("Informe as respostas da anamnese.");
        Map<String, String> errors = new LinkedHashMap<>();
        Set<String> known = new HashSet<>();
        fields.forEach(f -> known.add(f.key()));
        input.keySet().stream().filter(k -> !known.contains(k))
            .forEach(k -> errors.put(k, "Campo desconhecido."));
        Map<String, Object> clean = new LinkedHashMap<>();
        for (Field field : fields) {
            if (!visible(field, clean)) continue;
            Object value = input.get(field.key());
            if (value instanceof String s) value = s.trim();
            if (value == null || "".equals(value) || value instanceof List<?> list && list.isEmpty()) {
                if (finalize && field.required()) errors.put(field.key(), "Campo obrigatório.");
                continue;
            }
            String error = validateValue(field, value);
            if (error != null) errors.put(field.key(), error);
            else clean.put(field.key(), value);
        }
        if (!errors.isEmpty()) throw new AnamneseValidationException(errors);
        return clean;
    }

    private String validateValue(Field field, Object value) {
        return switch (field.type()) {
            case "number", "range" -> {
                if (!(value instanceof Number)) yield "Informe um número válido.";
                BigDecimal n;
                try { n = new BigDecimal(value.toString()); }
                catch (NumberFormatException e) { yield "Informe um número válido."; }
                if (n.compareTo(field.min()) < 0 || n.compareTo(field.max()) > 0)
                    yield "Informe um valor entre " + field.min() + " e " + field.max() + ".";
                if (n.subtract(field.min()).remainder(field.step()).compareTo(BigDecimal.ZERO) != 0)
                    yield "Precisão inválida para este campo.";
                yield null;
            }
            case "checkbox" -> {
                if (!(value instanceof List<?> list) || list.size() > field.options().size()
                    || !list.stream().allMatch(v -> v instanceof String && field.options().contains(v))
                    || new HashSet<>(list).size() != list.size())
                    yield "Selecione opções válidas.";
                if (field.exclusive() != null && list.contains(field.exclusive()) && list.size() > 1)
                    yield "A opção '" + field.exclusive() + "' não pode ser combinada com outras.";
                yield null;
            }
            case "select" -> field.options().contains(value) ? null : "Selecione uma opção válida.";
            default -> {
                if (!(value instanceof String s)) yield "Informe um texto válido.";
                if (s.length() > field.maxLength()) yield "Use até " + field.maxLength() + " caracteres.";
                if (field.pattern() != null && !s.matches(field.pattern())) yield "Formato inválido.";
                yield null;
            }
        };
    }
}
