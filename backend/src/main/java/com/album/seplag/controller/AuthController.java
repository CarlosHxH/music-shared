package com.album.seplag.controller;

import com.album.seplag.dto.ErrorResponse;
import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.dto.UsuarioDTO;
import com.album.seplag.dto.UsuarioRegisterDTO;
import com.album.seplag.service.AuthService;
import com.album.seplag.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("${app.api.base}/auth")
@Tag(name = "Autenticação", description = "Endpoints de autenticação")
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    public AuthController(AuthService authService, UsuarioService usuarioService) {
        this.authService = authService;
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Autentica usuário e retorna token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(summary = "Registro", description = "Registro público de novo usuário. Retorna token JWT (login automático)")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody UsuarioRegisterDTO request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token", description = "Aceita refresh token e retorna novo access token e refresh token. Não aceita access token.")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "Authorization", required = false) String authHeader, HttpServletRequest request) {
        String path = request.getRequestURI();
        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse(Instant.now(), HttpStatus.BAD_REQUEST.value(), "Bad Request",
                            "Header Authorization é obrigatório", path));
        }
        if (!authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse(Instant.now(), HttpStatus.BAD_REQUEST.value(), "Bad Request",
                            "Formato inválido. Use: Bearer <token>", path));
        }
        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse(Instant.now(), HttpStatus.BAD_REQUEST.value(), "Bad Request",
                            "Token não pode ser vazio", path));
        }
        LoginResponse response = authService.refreshToken(token);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Usuário logado", description = "Retorna os dados do usuário logado (baseado no token)")
    public ResponseEntity<UsuarioDTO> getMe() {
        String username = getCurrentUsername();
        UsuarioDTO usuario = usuarioService.findByUsername(username);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Invalida o token atual. O cliente deve descartar os tokens localmente.")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logout realizado com sucesso"));
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Usuário não autenticado");
        }
        return authentication.getName();
    }
}
