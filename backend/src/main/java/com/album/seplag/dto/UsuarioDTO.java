package com.album.seplag.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO para representação de usuário (sem senha).
 */
@Schema(description = "Dados do usuário")
public record UsuarioDTO(
    Long id,
    String username,
    String email,
    Boolean ativo,
    @Schema(description = "Papéis do usuário", allowableValues = {"ROLE_USER", "ROLE_ADMIN"})
    Set<String> roles,
    LocalDateTime createdAt,
    LocalDateTime lastLogin
) {}
