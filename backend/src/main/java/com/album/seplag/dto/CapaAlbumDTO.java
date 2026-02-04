package com.album.seplag.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * DTO para capa de álbum.
 * Datas em ISO-8601 (UTC) para evitar problemas de fuso horário no front-end.
 */
public record CapaAlbumDTO(
    Long id,
    String nomeArquivo,
    String contentType,
    Long tamanho,
    @Schema(description = "Data/hora do upload em ISO-8601 (UTC)", example = "2026-02-04T12:00:00Z")
    Instant dataUpload,
    String presignedUrl
) {}
