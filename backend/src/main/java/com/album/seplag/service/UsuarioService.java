package com.album.seplag.service;

import com.album.seplag.dto.*;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.exception.UsuarioJaExisteException;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UsuarioService implements UserDetailsService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Carregando usuário: {}", username);
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.info("Usuário não encontrado: {}", username);
                    return new UsernameNotFoundException("Usuário não encontrado: " + username);
                });

        if (!usuario.getAtivo()) {
            log.info("Tentativa de login com usuário inativo: {}", username);
            throw new UsernameNotFoundException("Usuário inativo: " + username);
        }

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .roles(usuario.getRoles().stream()
                        .map(role -> role.replace("ROLE_", ""))
                        .collect(Collectors.joining(",")))
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UsuarioDTO> findAll(Pageable pageable) {
        return usuarioRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public UsuarioDTO findById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));
        return toDTO(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioDTO findByUsername(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + username));
        return toDTO(usuario);
    }

    @Transactional
    public UsuarioDTO create(UsuarioCreateDTO dto) {
        validarUnicidade(dto.username(), dto.email(), null);

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.username());
        usuario.setPassword(passwordEncoder.encode(dto.password()));
        usuario.setEmail(dto.email());
        usuario.setAtivo(true);
        usuario.setRoles(new HashSet<>(normalizarRoles(dto.roles())));

        Usuario saved = usuarioRepository.save(usuario);
        log.info("Usuário criado com sucesso - ID: {}, username: {}", saved.getId(), saved.getUsername());
        return toDTO(saved);
    }

    @Transactional
    public UsuarioDTO register(UsuarioRegisterDTO dto) {
        validarUnicidade(dto.username(), dto.email(), null);

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.username());
        usuario.setPassword(passwordEncoder.encode(dto.password()));
        usuario.setEmail(dto.email());
        usuario.setAtivo(true);
        usuario.setRoles(new HashSet<>(Set.of(ROLE_USER)));

        Usuario saved = usuarioRepository.save(usuario);
        log.info("Usuário registrado com sucesso - ID: {}, username: {}", saved.getId(), saved.getUsername());
        return toDTO(saved);
    }

    @Transactional
    public UsuarioDTO update(Long id, UsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));
        validarUnicidade(dto.username(), dto.email(), id);

        usuario.setUsername(dto.username());
        usuario.setEmail(dto.email());

        Usuario saved = usuarioRepository.save(usuario);
        log.info("Usuário atualizado com sucesso - ID: {}", id);
        return toDTO(saved);
    }

    @Transactional
    public UsuarioDTO updateMe(String username, UsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + username));
        validarUnicidade(dto.username(), dto.email(), usuario.getId());

        usuario.setUsername(dto.username());
        usuario.setEmail(dto.email());

        Usuario saved = usuarioRepository.save(usuario);
        log.info("Usuário atualizou próprio perfil - username: {}", username);
        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deletando usuário com ID: {}", id);
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));
        usuarioRepository.delete(usuario);
        log.info("Usuário deletado com sucesso - ID: {}", id);
    }

    @Transactional
    public void alterarSenha(String username, AlterarSenhaDTO dto) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + username));

        if (!passwordEncoder.matches(dto.senhaAtual(), usuario.getPassword())) {
            throw new com.album.seplag.exception.InvalidCredentialsException("Senha atual incorreta");
        }

        usuario.setPassword(passwordEncoder.encode(dto.novaSenha()));
        usuarioRepository.save(usuario);
        log.info("Senha alterada com sucesso - username: {}", username);
    }

    @Transactional
    public void alterarSenhaAdmin(Long id, AlterarSenhaAdminDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));

        usuario.setPassword(passwordEncoder.encode(dto.novaSenha()));
        usuarioRepository.save(usuario);
        log.info("Senha alterada por admin - usuário ID: {}", id);
    }

    @Transactional
    public UsuarioDTO toggleAtivo(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));

        usuario.setAtivo(!usuario.getAtivo());
        Usuario saved = usuarioRepository.save(usuario);
        log.info("Usuário {} - ID: {}", usuario.getAtivo() ? "ativado" : "desativado", id);
        return toDTO(saved);
    }

    @Transactional
    public void atualizarLastLogin(String username) {
        usuarioRepository.findByUsername(username).ifPresent(usuario -> {
            usuario.setLastLogin(java.time.LocalDateTime.now());
            usuarioRepository.save(usuario);
        });
    }

    private void validarUnicidade(String username, String email, Long excludeId) {
        usuarioRepository.findByUsername(username).ifPresent(u -> {
            if (excludeId == null || !u.getId().equals(excludeId)) {
                throw new UsuarioJaExisteException("Username já cadastrado: " + username);
            }
        });
        usuarioRepository.findByEmail(email).ifPresent(u -> {
            if (excludeId == null || !u.getId().equals(excludeId)) {
                throw new UsuarioJaExisteException("Email já cadastrado: " + email);
            }
        });
    }

    private Set<String> normalizarRoles(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return Set.of(ROLE_USER);
        }
        Set<String> normalized = new HashSet<>();
        for (String role : roles) {
            normalized.add(role.startsWith("ROLE_") ? role : "ROLE_" + role);
        }
        return normalized.isEmpty() ? Set.of(ROLE_USER) : normalized;
    }

    private UsuarioDTO toDTO(Usuario usuario) {
        return new UsuarioDTO(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getAtivo(),
                usuario.getRoles(),
                usuario.getCreatedAt(),
                usuario.getLastLogin()
        );
    }
}
