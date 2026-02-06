package com.album.seplag.service;

import com.album.seplag.dto.RegionalDTO;
import com.album.seplag.model.Regional;
import com.album.seplag.repository.RegionalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RegionalService {

    private static final Logger logger = LoggerFactory.getLogger(RegionalService.class);

    private final RegionalRepository regionalRepository;
    private final RestTemplate restTemplate;

    @Value("${regional.api.url:https://integrador-argus-api.geia.vip/v1/regionais}")
    private String regionalApiUrl;

    public RegionalService(RegionalRepository regionalRepository, RestTemplate restTemplate) {
        this.regionalRepository = regionalRepository;
        this.restTemplate = restTemplate;
    }

    @Scheduled(fixedRate = 3600000) // A cada 1 hora
    @Transactional
    public void sincronizarRegionais() {
        try {
            logger.info("Iniciando sincronização de regionais...");

            List<Map<String, Object>> regionaisExternas = buscarRegionaisExternas();
            List<Regional> regionaisLocais = regionalRepository.findAll();

            Map<String, Regional> regionaisLocaisPorNome = regionaisLocais.stream()
                    .collect(Collectors.toMap(Regional::getNome, r -> r, (r1, r2) -> r1));
            java.util.Set<Long> externalIdsProcessados = new java.util.HashSet<>();

            for (Map<String, Object> regionalExterna : regionaisExternas) {
                String nome = extrairNome(regionalExterna);
                if (nome == null) continue;

                Long externalId = extrairExternalId(regionalExterna);

                if (externalId != null) {
                    Optional<Regional> porExternalId = regionalRepository.findByExternalId(externalId);
                    if (porExternalId.isPresent()) {
                        Regional regionalLocal = porExternalId.get();
                        if (nome.equals(regionalLocal.getNome())) {
                            if (!regionalLocal.getAtivo()) {
                                regionalLocal.setAtivo(true);
                                regionalRepository.save(regionalLocal);
                            }
                        } else {
                            regionalLocal.setAtivo(false);
                            regionalRepository.save(regionalLocal);
                            Regional novaRegional = new Regional();
                            novaRegional.setNome(nome);
                            novaRegional.setExternalId(externalId);
                            novaRegional.setAtivo(true);
                            regionalRepository.save(novaRegional);
                            logger.info("Atributo alterado: inativada '{}', criada nova '{}'", regionalLocal.getNome(), nome);
                        }
                        externalIdsProcessados.add(externalId);
                    } else {
                        Optional<Regional> porNome = regionalRepository.findByNome(nome);
                        if (porNome.isPresent()) {
                            Regional r = porNome.get();
                            if (r.getExternalId() == null) {
                                r.setExternalId(externalId);
                                r.setAtivo(true);
                                regionalRepository.save(r);
                            }
                        } else {
                            Regional novaRegional = new Regional();
                            novaRegional.setNome(nome);
                            novaRegional.setExternalId(externalId);
                            novaRegional.setAtivo(true);
                            regionalRepository.save(novaRegional);
                            logger.info("Nova regional inserida: {}", nome);
                        }
                        externalIdsProcessados.add(externalId);
                    }
                } else {
                    Optional<Regional> regionalLocalOpt = regionalRepository.findByNome(nome);
                    if (regionalLocalOpt.isPresent()) {
                        Regional regionalLocal = regionalLocalOpt.get();
                        if (!regionalLocal.getAtivo()) {
                            regionalLocal.setAtivo(true);
                            regionalRepository.save(regionalLocal);
                        }
                    } else {
                        Regional novaRegional = new Regional();
                        novaRegional.setNome(nome);
                        novaRegional.setAtivo(true);
                        regionalRepository.save(novaRegional);
                        logger.info("Nova regional inserida: {}", nome);
                    }
                }
                regionaisLocaisPorNome.remove(nome);
            }

            for (Regional regional : regionaisLocaisPorNome.values()) {
                if (regional.getAtivo()) {
                    regional.setAtivo(false);
                    regionalRepository.save(regional);
                    logger.info("Regional inativada (não disponível no endpoint): {}", regional.getNome());
                }
            }

            List<Regional> comExternalId = regionalRepository.findAll().stream()
                    .filter(r -> r.getExternalId() != null)
                    .toList();
            for (Regional r : comExternalId) {
                if (r.getAtivo() && !externalIdsProcessados.contains(r.getExternalId())) {
                    r.setAtivo(false);
                    regionalRepository.save(r);
                    logger.info("Regional inativada (external_id não encontrado): {}", r.getNome());
                }
            }

            logger.info("Sincronização de regionais concluída");
        } catch (Exception e) {
            logger.error("Erro ao sincronizar regionais", e);
        }
    }

    private String extrairNome(Map<String, Object> map) {
        Object v = map.get("nome");
        return v != null ? v.toString().trim() : null;
    }

    private Long extrairExternalId(Map<String, Object> map) {
        Object v = map.get("id");
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(v.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buscarRegionaisExternas() {
        try {
            Object response = restTemplate.getForObject(regionalApiUrl, Object.class);
            if (response instanceof List) {
                return (List<Map<String, Object>>) response;
            } else if (response instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) response;
                if (map.containsKey("data")) {
                    return (List<Map<String, Object>>) map.get("data");
                }
            }
            return List.of();
        } catch (Exception e) {
            logger.error("Erro ao buscar regionais externas", e);
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<RegionalDTO> findAll() {
        return regionalRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private RegionalDTO toDTO(Regional r) {
        return new RegionalDTO(
                r.getId(),
                r.getNome(),
                r.getAtivo(),
                r.getDataSincronizacao()
        );
    }
}

