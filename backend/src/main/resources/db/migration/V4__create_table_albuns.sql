-- =====================================================
-- Migration: V4 - Criação da tabela de álbuns
-- Descrição: Tabela para armazenar informações dos álbuns musicais
-- =====================================================

-- Tabela de álbuns
-- Coleções de músicas vinculadas a artistas e com capas no MinIO
CREATE TABLE IF NOT EXISTS albuns (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    data_lancamento DATE,
    capa_url VARCHAR(255),
    artista_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_album_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
    CONSTRAINT fk_album_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_album_titulo ON albuns(titulo);
CREATE INDEX IF NOT EXISTS idx_albuns_artista_id ON albuns(artista_id);

-- Trigger para atualização automática do campo updated_at
CREATE TRIGGER trg_albuns_updated_at 
    BEFORE UPDATE ON albuns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_timestamp_column();

-- Comentários de documentação
COMMENT ON TABLE albuns IS 'Coleções de músicas vinculadas a artistas e com capas no MinIO.';
COMMENT ON COLUMN albuns.id IS 'Identificador único do álbum.';
COMMENT ON COLUMN albuns.titulo IS 'Título do álbum.';
COMMENT ON COLUMN albuns.data_lancamento IS 'Data de lançamento do álbum.';
COMMENT ON COLUMN albuns.capa_url IS 'Caminho relativo no bucket MinIO (ex: album-covers/uuid.png).';
COMMENT ON COLUMN albuns.artista_id IS 'Referência ao ID do artista.';
COMMENT ON COLUMN albuns.usuario_id IS 'ID do usuário que cadastrou o álbum.';
COMMENT ON COLUMN albuns.created_at IS 'Data de criação do registro.';
COMMENT ON COLUMN albuns.updated_at IS 'Data da última atualização do registro.';
