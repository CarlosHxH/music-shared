import { useEffect, useState, useCallback, useMemo } from 'react';
import { albumFacadeService } from '@/services/AlbumFacadeService';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import { useAuth } from '@/contexts/AuthContext';
import type { Album, Artista } from '@/types/types';
import Modal from '@/components/common/Modal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { showApiErrorToast } from '@/lib/errorUtils';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ImagePreviewGrid } from '@/components/common/ImagePreviewGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AlbumCardSkeleton from '@/components/common/AlbumCardSkeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';

const SORT_OPTIONS = [
  { value: 'titulo', label: 'Título' },
  { value: 'dataLancamento', label: 'Data lançamento' }
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
  const [capasToDelete, setCapasToDelete] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [deleteAlbumOpen, setDeleteAlbumOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const tamanho = 12;

  const filePreviewItems = useMemo(() => {
    return selectedFiles.map((f, i) => ({
      id: `new-${i}-${f.name}`,
      url: URL.createObjectURL(f),
      onRemove: () => setSelectedFiles((prev) => prev.filter((_, j) => j !== i)),
    }));
  }, [selectedFiles]);

  useEffect(() => {
    return () => filePreviewItems.forEach((item) => URL.revokeObjectURL(item.url));
  }, [filePreviewItems]);

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
    setCapasToDelete([]);
    setShowNovoAlbum(true);
  }

  function fecharModal() {
    setShowNovoAlbum(false);
    setEditingAlbum(null);
    setTituloNovo('');
    setArtistaIdNovo('');
    setDataLancamentoNovo('');
    setSelectedFiles([]);
    setCapasToDelete([]);
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
      if (editingAlbum && capasToDelete.length > 0) {
        for (const capaId of capasToDelete) {
          await albumFacadeService.deletarCapa(albumId, capaId);
        }
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

  function abrirModalExcluirAlbum(album: Album) {
    setAlbumToDelete(album);
    setDeleteAlbumOpen(true);
  }

  async function handleConfirmDeleteAlbum() {
    if (!albumToDelete) return;
    try {
      await albumFacadeService.deletarAlbum(albumToDelete.id);
      await carregar(pagina);
    } catch (err) {
      showApiErrorToast(err, 'Erro ao deletar álbum');
      throw err;
    }
  }

  return (
    <div className="min-w-0">
      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl text-white font-bold truncate">Álbuns</h1>
        {usuario && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
            onClick={() => {
              setEditingAlbum(null);
              setTituloNovo('');
              setArtistaIdNovo('');
              setDataLancamentoNovo('');
              setSelectedFiles([]);
              setShowNovoAlbum(true);
            }}
          >
            <Plus className="size-4" />
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
            <FileInput
              id="capas-album"
              label={editingAlbum ? 'Adicionar ou alterar capas (png/jpg)' : 'Capas (png/jpg, opcional)'}
              accept="image/*"
              multiple
              onChange={(files) => setSelectedFiles(files ? (Array.isArray(files) ? files : [files]) : [])}
              placeholder="Arraste capas aqui ou clique para selecionar"
            />
            <ImagePreviewGrid
              items={[
                ...(editingAlbum?.capas ?? [])
                  .filter((c) => !capasToDelete.includes(c.id))
                  .map((c) => ({
                    id: `capa-${c.id}`,
                    url: c.presignedUrl ?? c.url ?? '/240x240.png',
                    onRemove: () => setCapasToDelete((prev) => [...prev, c.id]),
                  })),
                ...filePreviewItems,
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700"
              onClick={fecharModal}
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

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 sm:min-w-[180px]">
          <Label htmlFor="filtro-artista" className="text-slate-400 text-sm">
            Filtrar por artista
          </Label>
          <select
            id="filtro-artista"
            value={artistaId}
            onChange={(e) =>
              setArtistaId(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="mt-1 h-9 w-full sm:min-w-[180px] rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
          >
            <option value="">Todos os artistas</option>
            {artistas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 sm:min-w-[140px]">
          <Label htmlFor="sort-albuns" className="text-slate-400 text-sm">
            Ordenar por
          </Label>
          <select
            id="sort-albuns"
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
          <Label htmlFor="dir-albuns" className="text-slate-400 text-sm">
            Ordenação
          </Label>
          <select
            id="dir-albuns"
            value={direction}
            onChange={(e) => setDirection(e.target.value as typeof direction)}
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
                    <TooltipProvider delayDuration={300}>
                      <div className="flex shrink-0 gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 rounded-md"
                              onClick={() => abrirEdicao(album)}
                              aria-label="Editar álbum"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar álbum</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-700/80 rounded-md"
                              onClick={() => abrirModalExcluirAlbum(album)}
                              aria-label="Excluir álbum"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir álbum</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <DeleteConfirmModal
        open={deleteAlbumOpen}
        onOpenChange={(open) => {
          setDeleteAlbumOpen(open);
          if (!open) setAlbumToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAlbum}
        title="Excluir álbum?"
        description="Esta ação não pode ser desfeita. O álbum e suas capas serão removidos permanentemente."
        itemName={albumToDelete?.titulo}
      />

      <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-700 hover:bg-slate-600 text-white min-w-[100px] sm:min-w-0"
          onClick={() => carregar(Math.max(0, pagina - 1))}
          disabled={pagina === 0}
        >
          Anterior
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="bg-slate-700 hover:bg-slate-600 text-white min-w-[100px] sm:min-w-0"
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
