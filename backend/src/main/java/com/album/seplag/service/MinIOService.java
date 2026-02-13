package com.album.seplag.service;

import java.io.InputStream;
import java.net.URI;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.album.seplag.config.MinIOConfig;
import com.album.seplag.dto.PresignedUrlResponse;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.Artista;
import com.album.seplag.model.CapaAlbum;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.ArtistaRepository;
import com.album.seplag.repository.CapaAlbumRepository;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class MinIOService {

    private final MinioClient minioClient;
    private final MinIOConfig minIOConfig;
    private final String bucketName;
    private final Long presignedUrlExpiration;
    private final AlbumRepository albumRepository;
    private final ArtistaRepository artistaRepository;
    private final CapaAlbumRepository capaAlbumRepository;

    public MinIOService(MinIOConfig minIOConfig,
                       @Value("${minio.bucket-name}") String bucketName,
                       @Value("${minio.presigned-url-expiration}") Long presignedUrlExpiration,
                       AlbumRepository albumRepository,
                       ArtistaRepository artistaRepository,
                       CapaAlbumRepository capaAlbumRepository) {
        this.minioClient = minIOConfig.minioClient();
        this.minIOConfig = minIOConfig;
        this.bucketName = bucketName;
        this.presignedUrlExpiration = presignedUrlExpiration;
        this.albumRepository = albumRepository;
        this.artistaRepository = artistaRepository;
        this.capaAlbumRepository = capaAlbumRepository;
        initializeBucket();
    }

    /**
     * Reescreve a URL pré-assinada para usar a base pública (ex.: frontend + /minio)
     * quando minio.public-url está configurado, para o navegador poder carregar a imagem.
     */
    private String rewritePresignedUrlForClient(String internalUrl) {
        String publicUrl = minIOConfig.getPublicUrl();
        if (publicUrl == null || publicUrl.isBlank()) {
            return internalUrl;
        }
        try {
            URI uri = URI.create(internalUrl);
            String path = uri.getPath();
            String query = uri.getQuery();
            String pathAndQuery = path + (query != null && !query.isEmpty() ? "?" + query : "");
            String base = publicUrl.replaceAll("/$", "");
            return base + pathAndQuery;
        } catch (Exception e) {
            log.warn("Erro ao reescrever URL pré-assinada, retornando original: {}", e.getMessage());
            return internalUrl;
        }
    }

    private void initializeBucket() {
        try {
            log.info("Inicializando bucket MinIO: {}", bucketName);
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                log.info("Bucket não encontrado, criando bucket: {}", bucketName);
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Bucket criado com sucesso: {}", bucketName);
            } else {
                log.info("Bucket já existe: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("Erro ao inicializar bucket MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao inicializar bucket MinIO", e);
        }
    }

    @Transactional
    public CapaAlbum uploadCapa(Long albumId, MultipartFile file) {
        log.info("Fazendo upload de capa para álbum ID: {}, arquivo: {}", albumId, file.getOriginalFilename());
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Álbum não encontrado com id: " + albumId));

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            String objectName = "albuns/" + albumId + "/" + fileName;

            InputStream inputStream = file.getInputStream();
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.debug("Arquivo enviado para MinIO com sucesso: {}", objectName);

            CapaAlbum capa = new CapaAlbum();
            capa.setAlbum(album);
            capa.setNomeArquivo(objectName);
            capa.setContentType(file.getContentType());
            capa.setTamanho(file.getSize());

            CapaAlbum saved = capaAlbumRepository.save(capa);
            log.info("Capa salva com sucesso - ID: {}, Álbum ID: {}", saved.getId(), albumId);
            return saved;
        } catch (Exception e) {
            log.error("Erro ao fazer upload da capa para álbum ID {}: {}", albumId, e.getMessage(), e);
            throw new RuntimeException("Erro ao fazer upload da capa", e);
        }
    }

    public PresignedUrlResponse getPresignedUrl(Long albumId, Long capaId) {
        log.debug("Gerando URL pré-assinada para capa ID: {}, álbum ID: {}", capaId, albumId);
        try {
            CapaAlbum capa = capaAlbumRepository.findById(capaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Capa não encontrada com id: " + capaId));

            if (!capa.getAlbum().getId().equals(albumId)) {
                log.warn("Tentativa de acessar capa que não pertence ao álbum - Capa ID: {}, Álbum ID: {}", capaId, albumId);
                throw new ResourceNotFoundException("Capa não pertence ao álbum especificado");
            }

            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(capa.getNomeArquivo())
                            .expiry((int) (presignedUrlExpiration / 1000))
                            .build()
            );
            url = rewritePresignedUrlForClient(url);

            log.debug("URL pré-assinada gerada com sucesso para capa ID: {}", capaId);
            return new PresignedUrlResponse(url, presignedUrlExpiration);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao gerar URL pré-assinada para capa ID {}: {}", capaId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar URL pré-assinada", e);
        }
    }

    @Transactional
    public Artista uploadFotoArtista(Long artistaId, MultipartFile file) {
        log.info("Fazendo upload de foto para artista ID: {}, arquivo: {}", artistaId, file.getOriginalFilename());
        Artista artista = artistaRepository.findById(artistaId)
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + artistaId));

        try {
            String fileName = UUID.randomUUID().toString() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "foto");
            String objectName = "artistas/" + artistaId + "/" + fileName;

            InputStream inputStream = file.getInputStream();
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.debug("Foto enviada para MinIO com sucesso: {}", objectName);

            artista.setFotoNomeArquivo(objectName);
            Artista saved = artistaRepository.save(artista);
            log.info("Foto do artista salva com sucesso - Artista ID: {}", artistaId);
            return saved;
        } catch (Exception e) {
            log.error("Erro ao fazer upload da foto para artista ID {}: {}", artistaId, e.getMessage(), e);
            throw new RuntimeException("Erro ao fazer upload da foto do artista", e);
        }
    }

    public PresignedUrlResponse getPresignedUrlFotoArtista(Long artistaId) {
        log.debug("Gerando URL pré-assinada para foto do artista ID: {}", artistaId);
        Artista artista = artistaRepository.findById(artistaId)
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + artistaId));

        if (artista.getFotoNomeArquivo() == null || artista.getFotoNomeArquivo().isBlank()) {
            throw new ResourceNotFoundException("Artista não possui foto cadastrada");
        }

        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(artista.getFotoNomeArquivo())
                            .expiry((int) (presignedUrlExpiration / 1000))
                            .build()
            );
            url = rewritePresignedUrlForClient(url);

            log.debug("URL pré-assinada gerada com sucesso para foto do artista ID: {}", artistaId);
            return new PresignedUrlResponse(url, presignedUrlExpiration);
        } catch (Exception e) {
            log.error("Erro ao gerar URL pré-assinada para foto do artista ID {}: {}", artistaId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar URL pré-assinada da foto", e);
        }
    }

    @Transactional
    public void deleteFotoArtista(Long artistaId) {
        Artista artista = artistaRepository.findById(artistaId)
                .orElseThrow(() -> new ResourceNotFoundException("Artista não encontrado com id: " + artistaId));
        if (artista.getFotoNomeArquivo() == null || artista.getFotoNomeArquivo().isBlank()) {
            throw new ResourceNotFoundException("Artista não possui foto cadastrada");
        }
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(artista.getFotoNomeArquivo())
                    .build());
            artista.setFotoNomeArquivo(null);
            artistaRepository.save(artista);
            log.info("Foto do artista removida - Artista ID: {}", artistaId);
        } catch (Exception e) {
            log.error("Erro ao remover foto do artista ID {}: {}", artistaId, e.getMessage(), e);
            throw new RuntimeException("Erro ao remover foto do artista", e);
        }
    }

    @Transactional
    public void deleteCapa(Long albumId, Long capaId) {
        CapaAlbum capa = capaAlbumRepository.findById(capaId)
                .orElseThrow(() -> new ResourceNotFoundException("Capa não encontrada com id: " + capaId));
        if (!capa.getAlbum().getId().equals(albumId)) {
            throw new ResourceNotFoundException("Capa não pertence ao álbum especificado");
        }
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(capa.getNomeArquivo())
                    .build());
            capaAlbumRepository.delete(capa);
            log.info("Capa removida - Álbum ID: {}, Capa ID: {}", albumId, capaId);
        } catch (Exception e) {
            log.error("Erro ao remover capa {} do álbum {}: {}", capaId, albumId, e.getMessage(), e);
            throw new RuntimeException("Erro ao remover capa", e);
        }
    }
}

