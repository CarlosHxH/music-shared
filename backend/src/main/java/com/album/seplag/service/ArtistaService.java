package com.album.seplag.service;

import com.album.seplag.dto.ArtistaCreateDTO;
import com.album.seplag.dto.ArtistaDTO;
import com.album.seplag.dto.ArtistaUpdateDTO;
import com.album.seplag.dto.NotificationDTO;
import com.album.seplag.enums.TipoArtista;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Artista;
import com.album.seplag.repository.ArtistaRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
public class ArtistaService {

    private final ArtistaRepository artistaRepository;
    private final MinIOService minIOService;
    private final SimpMessagingTemplate messagingTemplate;

    public ArtistaService(ArtistaRepository artistaRepository, MinIOService minIOService,
                         SimpMessagingTemplate messagingTemplate) {
        this.artistaRepository = artistaRepository;
        this.minIOService = minIOService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public Page<ArtistaDTO> findAll(String nome, TipoArtista tipoArtista, Pageable pageable) {
        Page<Artista> artistas;
        boolean temNome = nome != null && !nome.trim().isEmpty();

        if (temNome && tipoArtista != null) {
            artistas = artistaRepository.findByNomeContainingIgnoreCaseAndTipoArtista(nome, tipoArtista, pageable);
        } else if (tipoArtista != null) {
            artistas = artistaRepository.findByTipoArtista(tipoArtista, pageable);
        } else if (temNome) {
            artistas = artistaRepository.findByNomeContainingIgnoreCase(nome, pageable);
        } else {
            artistas = artistaRepository.findAll(pageable);
        }

        return artistas.map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public ArtistaDTO findById(Long id) {
        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + id));
        return toDTO(artista);
    }

    @Transactional
    public ArtistaDTO create(ArtistaCreateDTO dto) {
        Artista artista = new Artista();
        artista.setNome(dto.nome());
        artista.setGenero(dto.genero());
        artista.setTipoArtista(dto.tipoArtista() != null ? dto.tipoArtista() : TipoArtista.CANTOR);
        artista.setBiografia(dto.biografia());
        Artista saved = artistaRepository.save(artista);
        ArtistaDTO savedDTO = toDTO(saved);
        NotificationDTO notification = new NotificationDTO(
                "ARTISTA_CREATED",
                "Artista \"" + saved.getNome() + "\" criado",
                Instant.now(),
                savedDTO
        );
        messagingTemplate.convertAndSend("/topic/artistas", notification);
        return savedDTO;
    }

    @Transactional
    public ArtistaDTO update(Long id, ArtistaUpdateDTO dto) {
        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + id));
        
        artista.setNome(dto.nome());
        artista.setGenero(dto.genero());
        artista.setTipoArtista(dto.tipoArtista() != null ? dto.tipoArtista() : artista.getTipoArtista());
        artista.setBiografia(dto.biografia());
        Artista saved = artistaRepository.save(artista);
        ArtistaDTO savedDTO = toDTO(saved);
        NotificationDTO notification = new NotificationDTO(
                "ARTISTA_UPDATED",
                "Artista \"" + saved.getNome() + "\" atualizado",
                Instant.now(),
                savedDTO
        );
        messagingTemplate.convertAndSend("/topic/artistas", notification);
        return savedDTO;
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deletando artista com ID: {}", id);
        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + id));
        String nome = artista.getNome();
        artistaRepository.delete(artista);
        log.info("Artista deletado com sucesso - ID: {}", id);

        NotificationDTO notification = new NotificationDTO(
                "ARTISTA_DELETED",
                "Artista \"" + nome + "\" removido",
                Instant.now(),
                Map.<String, Object>of("id", id)
        );
        messagingTemplate.convertAndSend("/topic/artistas", notification);
    }

    private ArtistaDTO toDTO(Artista artista) {
        return new ArtistaDTO(
            artista.getId(),
            artista.getNome(),
            artista.getGenero(),
            artista.getTipoArtista(),
            artista.getBiografia(),
            artista.getCreatedAt(),
            (long) artista.getAlbuns().size(),
            artista.getFotoNomeArquivo() != null ? minIOService.getPresignedUrlFotoArtista(artista.getId()).url() : null
        );
    }
}

