import { useEffect, useState, useCallback } from 'react';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import { useAuth } from '@/contexts/AuthContext';
import type { Artista, TipoArtista } from '@/types/types';
import ArtistCard from '@/components/common/ArtistCard';
import ArtistCardSkeleton from '@/components/common/ArtistCardSkeleton';
import Modal from '@/components/common/Modal';
import { useNavigate } from 'react-router-dom';
import { showApiErrorToast } from '@/lib/errorUtils';
import { ImagePreviewGrid } from '@/components/common/ImagePreviewGrid';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SORT_OPTIONS = [
  { value: 'nome', label: 'Nome' },
  { value: 'createdAt', label: 'Data criação' },
] as const;

/**
 * Tela inicial - Listagem de artistas
 * Cards com busca por nome, ordenação asc/desc e paginação
 */
export function HomePage() {
  const { user: usuario } = useAuth();
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [pagina, setPagina] = useState(0);
  const [tamanho] = useState(12);
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeDebounced, setNomeDebounced] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoArtista | ''>('');
  const [tipoFiltroDebounced, setTipoFiltroDebounced] = useState<TipoArtista | ''>('');
  const [sort, setSort] = useState<'nome' | 'id' | 'createdAt'>('nome');
  const [ordenacao, setOrdenacao] = useState<'ASC' | 'DESC'>('ASC');
  const [showNovoArtista, setShowNovoArtista] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [tipoNovo, setTipoNovo] = useState<TipoArtista>('CANTOR');
  const [descricaoNovo, setDescricaoNovo] = useState('');
  const [fotoNovo, setFotoNovo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setNomeDebounced(nome), 300);
    return () => clearTimeout(t);
  }, [nome]);

  useEffect(() => {
    const t = setTimeout(() => setTipoFiltroDebounced(tipoFiltro), 400);
    return () => clearTimeout(t);
  }, [tipoFiltro]);

  const carregar = useCallback(
    async (p: number) => {
      setCarregando(true);
      try {
        await artistFacadeService.carregarArtistas(
          p,
          tamanho,
          nomeDebounced || undefined,
          ordenacao,
          sort,
          tipoFiltroDebounced || undefined
        );
      } catch (error) {
        showApiErrorToast(error, 'Falha ao carregar artistas');
      } finally {
        setCarregando(false);
      }
    },
    [tamanho, nomeDebounced, ordenacao, sort, tipoFiltroDebounced]
  );

  useEffect(() => {
    const sub = artistFacadeService.obterArtistas().subscribe(setArtistas);
    setPagina(0);
    carregar(0);
    return () => sub.unsubscribe();
  }, [carregar]);

  function abrirDetalhe(id: number) {
    navigate(`/artistas/${id}`);
  }

  async function handleCriarArtista(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeNovo.trim()) return;
    setSalvando(true);
    try {
      const criado = await artistFacadeService.criarArtista(nomeNovo.trim(), descricaoNovo || undefined, tipoNovo);
      if (fotoNovo) {
        await artistFacadeService.uploadFotoArtista(criado.id, fotoNovo);
      }
      setShowNovoArtista(false);
      setNomeNovo('');
      setTipoNovo('CANTOR');
      setDescricaoNovo('');
      setFotoNovo(null);
      setPagina(0);
      await carregar(0);
      navigate(`/artistas/${criado.id}`);
    } catch (err) {
      showApiErrorToast(err, 'Erro ao criar artista');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-w-0">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl text-white font-bold truncate">Artistas</h1>
          {usuario && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
              onClick={() => setShowNovoArtista(true)}
            >
              <Plus className="size-4" />
              Novo Artista
            </Button>
          )}
        </header>

        <Modal
          open={showNovoArtista}
          onClose={() => {
            setShowNovoArtista(false);
            setFotoNovo(null);
          }}
          title="Novo Artista"
        >
          <form onSubmit={handleCriarArtista} className="space-y-4">
            <div>
              <Label htmlFor="nome-artista" className="text-slate-300">Nome</Label>
              <Input
                id="nome-artista"
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                required
                placeholder="Nome do artista"
                className="mt-1 bg-slate-700 border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="tipo-artista" className="text-slate-300">Tipo</Label>
              <select
                id="tipo-artista"
                value={tipoNovo}
                onChange={(e) => setTipoNovo(e.target.value as TipoArtista)}
                className="mt-1 w-full h-9 rounded-lg border border-slate-600 bg-slate-700 px-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              >
                <option value="CANTOR">Cantor</option>
                <option value="BANDA">Banda</option>
              </select>
            </div>
            <div>
              <Label htmlFor="desc-artista" className="text-slate-300">Descrição (opcional)</Label>
              <textarea
                id="desc-artista"
                value={descricaoNovo}
                onChange={(e) => setDescricaoNovo(e.target.value)}
                placeholder="Biografia ou descrição"
                className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white min-h-[80px] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label htmlFor="foto-artista" className="text-slate-300">Foto (opcional)</Label>
              <input
                id="foto-artista"
                type="file"
                accept="image/*"
                onChange={(e) => setFotoNovo(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-600 file:text-white file:cursor-pointer hover:file:bg-slate-500"
              />
              {fotoNovo && (
                <ImagePreviewGrid
                  items={[
                    {
                      id: 'foto-novo',
                      url: URL.createObjectURL(fotoNovo),
                      onRemove: () => setFotoNovo(null),
                    },
                  ]}
                />
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700"
                onClick={() => setShowNovoArtista(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Criar'}
              </Button>
            </div>
          </form>
        </Modal>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[180px]">
            <Label htmlFor="filtro-nome" className="text-slate-400 text-sm">
              Buscar por nome
            </Label>
            <Input
              id="filtro-nome"
              type="text"
              placeholder="Digite o nome..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <div className="min-w-0 sm:min-w-[120px]">
            <Label htmlFor="filtro-tipo" className="text-slate-400 text-sm">
              Tipo
            </Label>
            <select
              id="filtro-tipo"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as TipoArtista | '')}
              className="mt-1 h-9 w-full sm:w-auto rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
            >
              <option value="">Todos</option>
              <option value="CANTOR">Cantor</option>
              <option value="BANDA">Banda</option>
            </select>
          </div>
          <div className="min-w-0 sm:min-w-[140px]">
            <Label htmlFor="sort-artistas" className="text-slate-400 text-sm">
              Ordenar por
            </Label>
            <select
              id="sort-artistas"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="mt-1 h-9 w-full sm:w-auto rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 sm:min-w-[100px]">
            <Label htmlFor="dir-artistas" className="text-slate-400 text-sm">
              Direção
            </Label>
            <select
              id="dir-artistas"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as typeof ordenacao)}
              className="mt-1 h-9 w-full sm:w-auto rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
            >
              <option value="ASC">A-Z</option>
              <option value="DESC">Z-A</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {carregando ? (
            Array.from({ length: tamanho }).map((_, i) => (
              <ArtistCardSkeleton key={i} />
            ))
          ) : artistas.length === 0 ? (
            <div className="text-slate-400 col-span-full">Nenhum artista encontrado.</div>
          ) : (
            artistas.map((a) => (
              <ArtistCard key={a.id} artist={a} onClick={abrirDetalhe} />
            ))
          )}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="bg-slate-700 hover:bg-slate-600 text-white min-w-[100px] sm:min-w-0"
            onClick={() => {
              const p = Math.max(0, pagina - 1);
              setPagina(p);
              carregar(p);
            }}
            disabled={pagina === 0}
          >
            Anterior
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-slate-700 hover:bg-slate-600 text-white min-w-[100px] sm:min-w-0"
            onClick={() => {
              const p = pagina + 1;
              setPagina(p);
              carregar(p);
            }}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
