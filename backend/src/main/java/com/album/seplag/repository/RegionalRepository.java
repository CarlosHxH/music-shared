package com.album.seplag.repository;

import com.album.seplag.model.Regional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegionalRepository extends JpaRepository<Regional, Long> {
    Optional<Regional> findByNome(String nome);
}

