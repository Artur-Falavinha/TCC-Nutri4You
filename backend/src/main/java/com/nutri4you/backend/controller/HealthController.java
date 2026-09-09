package com.nutri4you.backend.controller;

import com.nutri4you.backend.dto.ApiResponse;
import com.nutri4you.backend.dto.HealthStatusDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<HealthStatusDTO>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.ok(
                HealthStatusDTO.up("backend"),
                "API operacional e conectada."));
    }
}
