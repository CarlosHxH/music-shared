package com.album.seplag.integration;

import com.album.seplag.dto.*;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UsuarioIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario usuarioComum;
    private Usuario usuarioAdmin;

    @BeforeEach
    void setUp() {
        usuarioComum = new Usuario();
        usuarioComum.setUsername("user1");
        usuarioComum.setPassword("$2a$10$encoded");
        usuarioComum.setEmail("user1@example.com");
        usuarioComum.setAtivo(true);
        usuarioComum.setRoles(new java.util.HashSet<>(Set.of("ROLE_USER")));
        usuarioComum = usuarioRepository.save(usuarioComum);

        usuarioAdmin = new Usuario();
        usuarioAdmin.setUsername("admin1");
        usuarioAdmin.setPassword("$2a$10$encoded");
        usuarioAdmin.setEmail("admin@example.com");
        usuarioAdmin.setAtivo(true);
        usuarioAdmin.setRoles(new java.util.HashSet<>(Set.of("ROLE_ADMIN", "ROLE_USER")));
        usuarioAdmin = usuarioRepository.save(usuarioAdmin);
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void getMe_ShouldReturnUsuarioDTO_WhenAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user1"))
                .andExpect(jsonPath("$.email").value("user1@example.com"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void getMe_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void updateMe_ShouldUpdateProfile_WhenDataIsValid() throws Exception {
        UsuarioUpdateDTO dto = new UsuarioUpdateDTO("user1updated", "updated@example.com");

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user1updated"))
                .andExpect(jsonPath("$.email").value("updated@example.com"));

        assertTrue(usuarioRepository.findByUsername("user1updated").isPresent());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void findAll_ShouldReturnPage_WhenAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(2)));
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void findAll_ShouldReturn403_WhenNotAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void findById_ShouldReturnUsuario_WhenAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/{id}", usuarioComum.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(usuarioComum.getId()))
                .andExpect(jsonPath("$.username").value("user1"));
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void create_ShouldCreateUsuario_WhenAdmin() throws Exception {
        UsuarioCreateDTO dto = new UsuarioCreateDTO("newuser", "password123", "new@example.com", Set.of("ROLE_USER"));

        mockMvc.perform(post("/api/v1/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("new@example.com"));

        assertTrue(usuarioRepository.findByUsername("newuser").isPresent());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void toggleAtivo_ShouldToggleStatus() throws Exception {
        mockMvc.perform(patch("/api/v1/usuarios/{id}/ativo", usuarioComum.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        Usuario updated = usuarioRepository.findById(usuarioComum.getId()).orElseThrow();
        assertFalse(updated.getAtivo());
    }
}
