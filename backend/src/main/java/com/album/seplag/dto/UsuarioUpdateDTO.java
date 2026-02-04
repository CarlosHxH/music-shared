package com.album.seplag.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para atualização de usuário.
 * Não inclui id, roles, ativo, createdAt ou lastLogin - o ID vem do path e campos sensíveis
 * são gerenciados por endpoints específicos (ex: toggleAtivo, alterarSenha).
 */
@Schema(description = "Dados atualizáveis do usuário. O ID é informado no path da URL e tem precedência. Campos como id, roles, ativo, createdAt e lastLogin não são alterados por este endpoint.")
public record UsuarioUpdateDTO(
    @Schema(description = "Username do usuário", example = "carlos.dias")
    @NotBlank(message = "Username é obrigatório")
    @Size(min = 3, max = 50, message = "Username deve ter entre 3 e 50 caracteres")
    String username,

    @Schema(description = "Email do usuário", example = "carlos.dias@example.com")
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 150)
    String email
) {}
