package com.album.seplag.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * Esquema padronizado para respostas de erro (4xx/5xx).
 */
@Schema(description = "Resposta de erro padronizada para códigos 4xx e 5xx")
public record ErrorResponse(
    @Schema(description = "Timestamp ISO-8601 do erro", example = "2026-02-04T12:00:00Z")
    Instant timestamp,

    @Schema(description = "Código HTTP de status")
    Integer status,

    @Schema(description = "Tipo do erro", example = "Unauthorized")
    String error,

    @Schema(description = "Mensagem descritiva do erro")
    String message,

    @Schema(description = "Path da requisição que gerou o erro", example = "/api/v1/usuarios")
    String path
) {}

