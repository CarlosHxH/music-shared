package com.album.seplag.service;

import com.album.seplag.dto.AlbumCreateDTO;
import com.album.seplag.dto.AlbumDTO;
import com.album.seplag.dto.AlbumUpdateDTO;
import com.album.seplag.dto.CapaAlbumDTO;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.Artista;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.ArtistaRepository;
import com.album.seplag.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Slf4j
@Service
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistaRepository artistaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MinIOService minIOService;
    private final SimpMessagingTemplate messagingTemplate;

    public AlbumService(AlbumRepository albumRepository, ArtistaRepository artistaRepository,
                       UsuarioRepository usuarioRepository, MinIOService minIOService, 
                       SimpMessagingTemplate messagingTemplate) {
        this.albumRepository = albumRepository;
        this.artistaRepository = artistaRepository;
        this.usuarioRepository = usuarioRepository;
        this.minIOService = minIOService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public Page<AlbumDTO> findAll(Pageable pageable) {
        return albumRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<AlbumDTO> findByArtistaId(Long artistaId, Pageable pageable) {
        return albumRepository.findByArtistaId(artistaId, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public AlbumDTO findById(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Álbum não encontrado com id: " + id));
        return toDTO(album);
    }

    @Transactional
    public AlbumDTO create(AlbumCreateDTO dto) {
        log.info("Criando novo álbum: {}", dto.titulo());
        try {
            Artista artista = artistaRepository.findById(dto.artistaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + dto.artistaId()));
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Usuario usuario = usuarioRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + username));
            
            Album album = new Album();
            album.setTitulo(dto.titulo());
            album.setDataLancamento(dto.dataLancamento());
            album.setArtista(artista);
            album.setUsuario(usuario);
            Album saved = albumRepository.save(album);
            
            log.info("Álbum criado com sucesso - ID: {}, Título: {}", saved.getId(), saved.getTitulo());
            
            // Notificar via WebSocket
            messagingTemplate.convertAndSend("/topic/albuns", toDTO(saved));
            
            return toDTO(saved);
        } catch (Exception e) {
            log.error("Erro ao criar álbum: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public AlbumDTO update(Long id, AlbumUpdateDTO dto) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Álbum não encontrado com id: " + id));
        
        album.setTitulo(dto.titulo());
        album.setDataLancamento(dto.dataLancamento());
        
        Artista artista = artistaRepository.findById(dto.artistaId())
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + dto.artistaId()));
        album.setArtista(artista);
        
        Album saved = albumRepository.save(album);
        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deletando álbum com ID: {}", id);
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Álbum não encontrado com id: " + id));
        albumRepository.delete(album);
        log.info("Álbum deletado com sucesso - ID: {}", id);
    }

    private AlbumDTO toDTO(Album album) {
        return new AlbumDTO(
            album.getId(),
            album.getTitulo(),
            album.getArtista().getId(),
            album.getArtista().getNome(),
            album.getDataLancamento(),
            album.getCreatedAt(),
            album.getCapas().stream()
                .map(capa -> new CapaAlbumDTO(
                    capa.getId(),
                    capa.getNomeArquivo(),
                    capa.getContentType(),
                    capa.getTamanho(),
                    capa.getDataUpload(),
                    null // presignedUrl será preenchido quando necessário
                ))
                .collect(Collectors.toList())
        );
    }
}

