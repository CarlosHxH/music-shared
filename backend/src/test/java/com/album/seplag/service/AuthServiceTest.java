package com.album.seplag.service;

import com.album.seplag.config.JwtConfig;
import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.exception.InvalidCredentialsException;
import com.album.seplag.exception.InvalidTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtConfig jwtConfig;

    @Mock
    private UsuarioService usuarioService;

    private AuthService authService;

    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        userDetails = User.builder()
                .username("testuser")
                .password("encodedPassword")
                .roles("USER")
                .build();
        authService = new AuthService(userDetailsService, passwordEncoder, jwtConfig, usuarioService);
    }

    @Test
    void login_ShouldReturnLoginResponse_WhenCredentialsAreValid() {
        LoginRequest request = new LoginRequest("testuser", "password");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(passwordEncoder.matches("password", userDetails.getPassword())).thenReturn(true);
        when(jwtConfig.generateAccessToken(eq("testuser"), anyList())).thenReturn("access-token");
        when(jwtConfig.generateRefreshToken("testuser")).thenReturn("refresh-token");
        when(jwtConfig.getExpiration()).thenReturn(300000L);
        doNothing().when(usuarioService).atualizarLastLogin("testuser");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());
        assertEquals("Bearer", response.type());
        assertEquals(300000L, response.expiresIn());
        verify(jwtConfig).generateAccessToken(eq("testuser"), anyList());
        verify(jwtConfig).generateRefreshToken("testuser");
    }

    @Test
    void login_ShouldThrowInvalidCredentialsException_WhenPasswordIsInvalid() {
        LoginRequest request = new LoginRequest("testuser", "wrongpassword");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(passwordEncoder.matches("wrongpassword", userDetails.getPassword())).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_ShouldThrowInvalidCredentialsException_WhenUserNotFound() {
        LoginRequest request = new LoginRequest("nonexistent", "password");
        when(userDetailsService.loadUserByUsername("nonexistent"))
                .thenThrow(new UsernameNotFoundException("Usuário não encontrado"));

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void refreshToken_ShouldReturnNewTokens_WhenRefreshTokenIsValid() {
        String refreshToken = "valid-refresh-token";
        var usuarioDTO = new com.album.seplag.dto.UsuarioDTO(1L, "testuser", "test@example.com", true, Set.of("ROLE_USER"), null, null);
        when(jwtConfig.getUsernameFromToken(anyString())).thenReturn("testuser");
        when(jwtConfig.validateRefreshToken(anyString(), eq("testuser"))).thenReturn(true);
        when(usuarioService.findByUsername("testuser")).thenReturn(usuarioDTO);
        when(jwtConfig.generateAccessToken(eq("testuser"), anyList())).thenReturn("new-access-token");
        when(jwtConfig.generateRefreshToken("testuser")).thenReturn("new-refresh-token");
        when(jwtConfig.getExpiration()).thenReturn(300000L);

        LoginResponse response = authService.refreshToken(refreshToken);

        assertNotNull(response);
        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());
        assertEquals("Bearer", response.type());
        verify(jwtConfig).generateAccessToken(eq("testuser"), anyList());
        verify(jwtConfig).generateRefreshToken("testuser");
    }

    @Test
    void refreshToken_ShouldThrowInvalidTokenException_WhenTokenIsInvalid() {
        String token = "invalid-token";
        when(jwtConfig.getUsernameFromToken(token)).thenReturn("testuser");
        when(jwtConfig.validateRefreshToken(token, "testuser")).thenReturn(false);

        assertThrows(InvalidTokenException.class, () -> authService.refreshToken(token));
    }
}
