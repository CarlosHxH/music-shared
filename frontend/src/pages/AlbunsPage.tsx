import { useEffect, useState, useCallback } from 'react';
import { albumFacadeService } from '@/services/AlbumFacadeService';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import { useAuth } from '@/contexts/AuthContext';
import type { Album, Artista } from '@/types/types';
import Modal from '@/components/common/Modal';
import { showApiErrorToast } from '@/lib/errorUtils';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AlbumCardSkeleton from '@/components/common/AlbumCardSkeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SORT_OPTIONS = [
  { value: 'titulo', label: 'Título' },
  { value: 'dataLancamento', label: 'Data lançamento' },
  { value: 'id', label: 'ID' },
] as const;

/**
 * Página de listagem de álbuns
 * Grid de cards com capa, título e artista. Paginação, ordenação e filtro por artista.
 */
export default function AlbunsPage() {
  const { user: usuario } = useAuth();
  const [albuns, setAlbuns] = useState<Album[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [sort, setSort] = useState<'titulo' | 'dataLancamento' | 'id'>('titulo');
  const [direction, setDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [artistaId, setArtistaId] = useState<number | ''>('');
  const [showNovoAlbum, setShowNovoAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [tituloNovo, setTituloNovo] = useState('');
  const [artistaIdNovo, setArtistaIdNovo] = useState<number | ''>('');
  const [dataLancamentoNovo, setDataLancamentoNovo] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const tamanho = 12;

  const carregar = useCallback(
    async (p: number) => {
      setCarregando(true);
      try {
        if (artistaId && typeof artistaId === 'number') {
          await albumFacadeService.carregarAlbunsPorArtista(
            artistaId,
            p,
            tamanho,
            sort,
            direction
          );
        } else {
          await albumFacadeService.carregarAlbuns(p, tamanho, sort, direction);
        }
      } catch (error) {
        showApiErrorToast(error, 'Falha ao carregar álbuns');
      } finally {
        setCarregando(false);
      }
    },
    [sort, direction, artistaId]
  );

  useEffect(() => {
    artistFacadeService.carregarArtistas(0, 500).catch((err) => {
      showApiErrorToast(err, 'Falha ao carregar artistas');
    });
  }, []);

  useEffect(() => {
    const subAlbuns = albumFacadeService.obterAlbuns().subscribe(setAlbuns);
    const subTotal = albumFacadeService.obterTotalPaginas().subscribe(setTotalPaginas);
    const subPagina = albumFacadeService.obterPagina().subscribe(setPagina);
    const subArtistas = artistFacadeService.obterArtistas().subscribe(setArtistas);
    setPagina(0);
    carregar(0);
    return () => {
      subAlbuns.unsubscribe();
      subTotal.unsubscribe();
      subPagina.unsubscribe();
      subArtistas.unsubscribe();
    };
  }, [carregar]);

  function abrirEdicao(album: Album) {
    setEditingAlbum(album);
    setTituloNovo(album.titulo);
    setArtistaIdNovo(album.artistaId);
    setDataLancamentoNovo(album.dataLancamento ?? '');
    setSelectedFiles([]);
    setShowNovoAlbum(true);
  }

  function fecharModal() {
    setShowNovoAlbum(false);
    setEditingAlbum(null);
    setTituloNovo('');
    setArtistaIdNovo('');
    setDataLancamentoNovo('');
    setSelectedFiles([]);
  }

  async function handleSubmitAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!tituloNovo.trim() || !artistaIdNovo || typeof artistaIdNovo !== 'number') return;
    setSalvando(true);
    try {
      let albumId: number;
      if (editingAlbum) {
        await albumFacadeService.atualizarAlbum(
          editingAlbum.id,
          tituloNovo.trim(),
          artistaIdNovo,
          dataLancamentoNovo || undefined
        );
        albumId = editingAlbum.id;
      } else {
        const criado = await albumFacadeService.criarAlbum(
          tituloNovo.trim(),
          artistaIdNovo,
          dataLancamentoNovo || undefined
        );
        albumId = criado.id;
      }
      if (selectedFiles.length > 0) {
        await albumFacadeService.uploadCapas(albumId, selectedFiles);
      }
      fecharModal();
      await carregar(pagina);
    } catch (err) {
      showApiErrorToast(err, editingAlbum ? 'Erro ao atualizar álbum' : 'Erro ao criar álbum');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletarAlbum(albumId: number) {
    if (!confirm('Confirma exclusão do álbum?')) return;
    try {
      await albumFacadeService.deletarAlbum(albumId);
      await carregar(pagina);
    } catch (err) {
      showApiErrorToast(err, 'Erro ao deletar álbum');
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl text-white font-bold">Álbuns</h1>
        {usuario && (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              setEditingAlbum(null);
              setTituloNovo('');
              setArtistaIdNovo('');
              setDataLancamentoNovo('');
              setSelectedFiles([]);
              setShowNovoAlbum(true);
            }}
          >
            Novo Álbum
          </Button>
        )}
      </header>

      <Modal open={showNovoAlbum} onClose={fecharModal} title={editingAlbum ? 'Editar Álbum' : 'Novo Álbum'}>
        <form onSubmit={handleSubmitAlbum} className="space-y-4">
          <div>
            <Label htmlFor="artista-album" className="text-slate-300">Artista</Label>
            <select
              id="artista-album"
              value={artistaIdNovo}
              onChange={(e) => setArtistaIdNovo(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="mt-1 w-full h-9 rounded-lg border border-slate-600 bg-slate-700 px-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              <option value="">Selecione o artista</option>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="titulo-album" className="text-slate-300">Título</Label>
            <Input
              id="titulo-album"
              value={tituloNovo}
              onChange={(e) => setTituloNovo(e.target.value)}
              required
              placeholder="Título do álbum"
              className="mt-1 bg-slate-700 border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
          <div>
            <Label htmlFor="data-album" className="text-slate-300">Data de lançamento (opcional)</Label>
            <Input
              id="data-album"
              type="date"
              value={dataLancamentoNovo}
              onChange={(e) => setDataLancamentoNovo(e.target.value)}
              className="mt-1 bg-slate-700 border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
          <div>
            <Label htmlFor="capas-album" className="text-slate-300">
              {editingAlbum ? 'Adicionar ou alterar capas (png/jpg)' : 'Capas (png/jpg, opcional)'}
            </Label>
            <input
              id="capas-album"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="mt-1 w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-600 file:text-white file:cursor-pointer hover:file:bg-slate-500"
            />
            {selectedFiles.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">{selectedFiles.length} arquivo(s) selecionado(s)</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={fecharModal}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : editingAlbum ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="filtro-artista" className="text-slate-400 text-sm">
            Filtrar por artista
          </Label>
          <select
            id="filtro-artista"
            value={artistaId}
            onChange={(e) =>
              setArtistaId(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="mt-1 h-9 min-w-[180px] rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
          >
            <option value="">Todos os artistas</option>
            {artistas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sort-albuns" className="text-slate-400 text-sm">
            Ordenar por
          </Label>
          <select
            id="sort-albuns"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="mt-1 h-9 rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="dir-albuns" className="text-slate-400 text-sm">
            Ordenação
          </Label>
          <select
            id="dir-albuns"
            value={direction}
            onChange={(e) => setDirection(e.target.value as typeof direction)}
            className="mt-1 h-9 rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
          >
            <option value="ASC">A-Z</option>
            <option value="DESC">Z-A</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {carregando ? (
          Array.from({ length: tamanho }).map((_, i) => (
            <AlbumCardSkeleton key={i} />
          ))
        ) : albuns.length === 0 ? (
          <div className="text-slate-400 col-span-full">Nenhum álbum encontrado.</div>
        ) : (
          albuns.map((album) => (
            <Card
              key={album.id}
              className="bg-slate-800/60 border-slate-700 overflow-hidden p-0 gap-0 shadow-md hover:shadow-lg transition"
            >
              <div className="h-44 w-full bg-gray-800 flex items-center justify-center">
                <AlbumCover album={album} />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold truncate">{album.titulo}</h3>
                    <p className="text-sm text-slate-400 mt-1">{album.artistaNome}</p>
                  </div>
                  {usuario && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50"
                        onClick={() => abrirEdicao(album)}
                        aria-label="Editar álbum"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-700/50"
                        onClick={() => handleDeletarAlbum(album.id)}
                        aria-label="Excluir álbum"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          className="bg-slate-700 hover:bg-slate-600 text-white"
          onClick={() => carregar(Math.max(0, pagina - 1))}
          disabled={pagina === 0}
        >
          Anterior
        </Button>

        <Button
          variant="secondary"
          className="bg-slate-700 hover:bg-slate-600 text-white"
          onClick={() => carregar(pagina + 1)}
          disabled={pagina >= totalPaginas - 1 || totalPaginas === 0}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

function AlbumCover({ album }: { album: Album }) {
  const url = album.capas?.[0]?.presignedUrl ?? album.capas?.[0]?.url ?? null;
  return (
    <img
      src={url ?? "/240x240.png"}
      alt={album.titulo}
      className="object-cover w-full h-44"
    />
  );
}
