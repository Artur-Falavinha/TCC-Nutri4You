package com.nutri4you.backend.dto;
import java.util.Map;
public record AnamneseRequest(Long versao, Map<String, Object> respostas) {}
