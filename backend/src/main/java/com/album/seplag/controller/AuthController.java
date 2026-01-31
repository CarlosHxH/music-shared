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
    public ResponseEntity<LoginResponse> refreshToken(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer "
        LoginResponse response = usuarioService.refreshToken(token);
        return ResponseEntity.ok(response);
    }
}