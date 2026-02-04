/**
 * Tipos e Interfaces da Aplicação
 */

export interface Usuario {
  id: number;
  username: string;
  email: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: string[];
}

export interface Artista {
  id: number;
  nome: string;
  descricao?: string;
  fotoNomeArquivo?: string;
  createdAt: string;
  updatedAt: string;
  albumCount?: number;
}

export interface Album {
  id: number;
  titulo: string;
  artistaId: number;
  artistaNome: string;
  dataLancamento?: string;
  createdAt: string;
  capas: CapaAlbum[];
}

export interface CapaAlbum {
  id: number;
  nomeArquivo: string;
  contentType: string;
  tamanho: number;
  dataUpload: string;
  url?: string;
}

export interface Regional {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}
