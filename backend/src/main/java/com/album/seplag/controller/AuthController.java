package com.album.seplag.controller;

import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${app.api.base}/auth")
@Tag(name = "Autenticação", description = "Endpoints de autenticação")
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica usuário e retorna token JWT")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = usuarioService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(
                java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Credenciais inválidas")
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                java.util.Map.of("message", "Erro ao processar login: " + e.getMessage())
            );
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token", description = "Renova token JWT expirado")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Header Authorization é obrigatório"));
        }
        if (!authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Formato inválido. Use: Bearer <token>"));
        }
        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Token não pode ser vazio"));
        }
        try {
            LoginResponse response = usuarioService.refreshToken(token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Token inválido ou expirado"));
        }
    }
}