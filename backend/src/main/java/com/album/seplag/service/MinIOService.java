package com.album.seplag.service;

import com.album.seplag.config.MinIOConfig;
import com.album.seplag.dto.PresignedUrlResponse;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.CapaAlbum;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.CapaAlbumRepository;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
public class MinIOService {

    private final MinioClient minioClient;
    private final String bucketName;
    private final Long presignedUrlExpiration;
    private final AlbumRepository albumRepository;
    private final CapaAlbumRepository capaAlbumRepository;

    public MinIOService(MinIOConfig minIOConfig,
                       @Value("${minio.bucket-name}") String bucketName,
                       @Value("${minio.presigned-url-expiration}") Long presignedUrlExpiration,
                       AlbumRepository albumRepository,
                       CapaAlbumRepository capaAlbumRepository) {
        this.minioClient = minIOConfig.minioClient();
        this.bucketName = bucketName;
        this.presignedUrlExpiration = presignedUrlExpiration;
        this.albumRepository = albumRepository;
        this.capaAlbumRepository = capaAlbumRepository;
        initializeBucket();
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

            log.debug("URL pré-assinada gerada com sucesso para capa ID: {}", capaId);
            return new PresignedUrlResponse(url, presignedUrlExpiration);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao gerar URL pré-assinada para capa ID {}: {}", capaId, e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar URL pré-assinada", e);
        }
    }
}

