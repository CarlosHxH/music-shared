package com.album.seplag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para admin alterar senha de qualquer usuário.
 */
public record AlterarSenhaAdminDTO(
    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 6, message = "Nova senha deve ter no mínimo 6 caracteres")
    String novaSenha
) {}
