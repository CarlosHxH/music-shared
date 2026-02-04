package com.album.seplag.dto;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO para representação de usuário (sem senha).
 */
public record UsuarioDTO(
    Long id,
    String username,
    String email,
    Boolean ativo,
    Set<String> roles,
    LocalDateTime createdAt,
    LocalDateTime lastLogin
) {}
