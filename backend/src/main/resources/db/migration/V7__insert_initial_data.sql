-- =====================================================
-- Migration: V7 - Inserção de dados iniciais
-- Descrição: Popula o banco de dados com dados de exemplo e usuário administrador padrão
-- =====================================================

-- =====================================================
-- Usuário Administrador Padrão
-- =====================================================
-- Inserir usuário padrão (senha: admin123)
-- Hash BCrypt válido para "admin123"
-- Este usuário possui permissões de administrador e usuário comum
INSERT INTO usuarios (username, password, email) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwy8p8qO', 'admin@seplag.com')
ON CONFLICT (username) DO NOTHING;

-- Inserir roles do usuário admin (usando subquery para obter o ID)
-- Role de administrador: permite acesso total ao sistema
INSERT INTO usuario_roles (usuario_id, role)
SELECT u.id, 'ROLE_ADMIN' FROM usuarios u WHERE u.username = 'admin'
ON CONFLICT (usuario_id, role) DO NOTHING;

-- Role de usuário comum: permite operações básicas
INSERT INTO usuario_roles (usuario_id, role)
SELECT u.id, 'ROLE_USER' FROM usuarios u WHERE u.username = 'admin'
ON CONFLICT (usuario_id, role) DO NOTHING;

-- =====================================================
-- Artistas de Exemplo
-- =====================================================
-- Inserir artistas de exemplo para demonstração do sistema
INSERT INTO artistas (nome) VALUES
('Serj Tankian'),      -- Artista solo, ex-vocalista do System of a Down
('Mike Shinoda'),      -- Artista solo, membro do Linkin Park
('Michel Teló'),       -- Artista sertanejo brasileiro
('Guns N'' Roses');    -- Banda de rock clássico

-- =====================================================
-- Álbuns de Exemplo
-- =====================================================
-- Inserir álbuns de exemplo vinculados aos artistas acima
-- Os IDs dos artistas são baseados na ordem de inserção (1, 2, 3, 4)
-- O usuario_id é o ID do usuário admin (geralmente 1)
INSERT INTO albuns (titulo, artista_id, usuario_id, data_lancamento) VALUES
-- Álbuns do Serj Tankian (ID: 1)
-- usuario_id = 1 (admin)
('Harakiri', 1, 1, '2012-07-10'),
('Black Blooms', 1, 1, '2015-10-23'),
('The Rough Dog', 1, 1, '2018-09-14'),
-- Álbuns do Mike Shinoda (ID: 2)
('The Rising Tied', 2, 1, '2005-11-22'),
('Post Traumatic', 2, 1, '2018-06-15'),
('Post Traumatic EP', 2, 1, '2018-01-19'),
('Where''d You Go', 2, 1, '2005-11-22'),
-- Álbuns do Michel Teló (ID: 3)
('Bem Sertanejo', 3, 1, '2011-01-01'),
('Bem Sertanejo - O Show (Ao Vivo)', 3, 1, '2012-01-01'),
('Bem Sertanejo - (1ª Temporada) - EP', 3, 1, '2011-01-01'),
-- Álbuns do Guns N'' Roses (ID: 4)
('Use Your Illusion I', 4, 1, '1991-09-17'),
('Use Your Illusion II', 4, 1, '1991-09-17'),
('Greatest Hits', 4, 1, '2004-03-23');

