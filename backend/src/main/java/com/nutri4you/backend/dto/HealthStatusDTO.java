package com.nutri4you.backend.dto;

import java.time.Instant;

public record HealthStatusDTO(String status, String service, Instant timestamp) {

    public static HealthStatusDTO up(String service) {
        return new HealthStatusDTO("UP", service, Instant.now());
    }
}
