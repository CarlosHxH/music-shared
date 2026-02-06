import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import { albumFacadeService } from '@/services/AlbumFacadeService';
import { authService } from '@/services/AuthService';
import type { Artista, Album, Usuario, TipoArtista } from '@/types/types';
import Modal from '@/components/common/Modal';
import { ImagePreviewGrid } from '@/components/common/ImagePreviewGrid';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { showApiErrorToast } from '@/lib/errorUtils';

/**
 * Página de Detalhe do Artista
 * Exibe informações do artista e grade de álbuns com capas (presigned URLs)
 */
export default function ArtistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artista, setArtista] = useState<Artista | null>(null);
  const [albuns, setAlbuns] = useState<Album[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [titulo, setTitulo] = useState('');
  const [dataLancamento, setDataLancamento] = useState<string | undefined>(undefined);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [capasToDelete, setCapasToDelete] = useState<number[]>([]);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [selectedFotoFile, setSelectedFotoFile] = useState<File | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [nomeArtista, setNomeArtista] = useState<string>('');
  const [descricaoArtista, setDescricaoArtista] = useState<string>('');
  const [tipoArtista, setTipoArtista] = useState<TipoArtista>('CANTOR');
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!id) return;
    const artistId = Number(id);

    const subArtist = artistFacadeService.obterSelecionado().subscribe((a) => {
      setArtista(a);
    });

    const subAlbuns = albumFacadeService.obterAlbuns().subscribe((a) => setAlbuns(a));

    (async () => {
      try {
        setCarregando(true);
        await artistFacadeService.carregarArtistaById(artistId);
        await albumFacadeService.carregarAlbunsPorArtista(artistId, 0, 12);
      } catch (error) {
        showApiErrorToast(error, 'Falha ao carregar dados do artista');
      } finally {
        setCarregando(false);
      }
    })();

    const subUsuario = authService.obterUsuario().subscribe((u) => setUsuario(u));

    return () => {
      subArtist.unsubscribe();
      subAlbuns.unsubscribe();
      subUsuario.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const artistId = id ? Number(id) : null;

  function abrirFormularioNovo() {
    setEditingAlbum(null);
    setTitulo('');
    setDataLancamento(undefined);
    setSelectedFiles([]);
    setCapasToDelete([]);
    setShowForm(true);
  }

  function abrirFormularioEdicao(album: Album) {
    setEditingAlbum(album);
    setTitulo(album.titulo);
    setDataLancamento(album.dataLancamento ?? undefined);
    setSelectedFiles([]);
    setCapasToDelete([]);
    setShowForm(true);
  }

  function fecharFormulario() {
    setShowForm(false);
    setEditingAlbum(null);
  }

  async function handleSubmitAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!artistId) return;
    try {
      setCarregando(true);
      let albumResult: Album;
      if (editingAlbum) {
        albumResult = await albumFacadeService.atualizarAlbum(editingAlbum.id, titulo, artistId, dataLancamento);
      } else {
        albumResult = await albumFacadeService.criarAlbum(titulo, artistId, dataLancamento);
      }

      if (editingAlbum && capasToDelete.length > 0) {
        for (const capaId of capasToDelete) {
          await albumFacadeService.deletarCapa(editingAlbum.id, capaId);
        }
      }
      if (selectedFiles && selectedFiles.length > 0) {
        await albumFacadeService.uploadCapas(albumResult.id, selectedFiles);
      }

      // Recarregar lista de álbuns
      await albumFacadeService.carregarAlbunsPorArtista(artistId, 0, 12);
      fecharFormulario();
    } catch (err) {
      showApiErrorToast(err, 'Erro ao salvar álbum');
    } finally {
      setCarregando(false);
    }
  }

  async function handleDeleteAlbum(albumId: number) {
    if (!artistId) return;
    if (!confirm('Confirma exclusão do álbum?')) return;
    try {
      await albumFacadeService.deletarAlbum(albumId);
      await albumFacadeService.carregarAlbunsPorArtista(artistId, 0, 12);
    } catch (err) {
      showApiErrorToast(err, 'Erro ao deletar álbum');
    }
  }

  async function handleDeleteArtista() {
    if (!artistId) return;
    if (!confirm(`Confirma exclusão do artista "${artista?.nome}"? Todos os álbuns serão removidos.`)) return;
    try {
      await artistFacadeService.deletarArtista(artistId);
      navigate('/');
    } catch (err) {
      showApiErrorToast(err, 'Erro ao excluir artista');
    }
  }

  return (
    <div className="min-w-0">
      <div className="max-w-5xl mx-auto">
        <button
          className="text-slate-400 mb-4 hover:text-slate-200 transition-colors text-sm sm:text-base touch-manipulation"
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </button>

        {artista ? (
          <header className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 min-w-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-gray-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={artista.fotoUrl ?? "/240x240.png"}
                  alt={artista.nome}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="text-center sm:text-left min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-white font-bold truncate max-w-full">
                    {artista.nome}
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-600 text-slate-300 shrink-0">
                    {artista.tipoArtista === 'BANDA' ? 'Banda' : 'Cantor'}
                  </span>
                </div>
                {(artista.biografia ?? artista.descricao) && (
                  <p className="text-slate-400 mt-2 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">
                    {artista.biografia ?? artista.descricao}
                  </p>
                )}
                <p className="text-slate-500 mt-1 text-sm">
                  {artista.quantidadeAlbuns ?? artista.albumCount ?? albuns.length} álbuns
                </p>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end shrink-0">
              {usuario ? (
                <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    onClick={() => {
                      setNomeArtista(artista.nome);
                      setDescricaoArtista((artista.biografia ?? artista.descricao) ?? '');
                      setTipoArtista(artista.tipoArtista ?? 'CANTOR');
                      setSelectedFotoFile(null);
                      setShowFotoModal(true);
                    }}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                    onClick={() => abrirFormularioNovo()}
                  >
                    <Plus className="size-4" />
                    Novo Álbum
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-red-950/50 hover:border-red-800 hover:text-red-400"
                    onClick={handleDeleteArtista}
                    aria-label="Excluir artista"
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Button>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">Faça login para criar álbuns</div>
              )}
            </div>
          </header>
        ) : (
          <div className="text-slate-400 mb-4">Carregando artista...</div>
        )}

        {/* Formulário de criação/edição de álbum em modal */}
        <Modal open={showForm} onClose={fecharFormulario} title={editingAlbum ? 'Editar Álbum' : 'Novo Álbum'}>
          <form onSubmit={handleSubmitAlbum} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300">Título</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg mt-1 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Data de lançamento</label>
              <input
                type="date"
                value={dataLancamento ?? ''}
                onChange={(e) => setDataLancamento(e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg mt-1 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Capas (png/jpg)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                className="mt-1 w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-600 file:text-white file:cursor-pointer hover:file:bg-slate-500"
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
                  ...selectedFiles.map((f, i) => ({
                    id: `new-${i}-${f.name}`,
                    url: URL.createObjectURL(f),
                    onRemove: () => setSelectedFiles((prev) => prev.filter((_, j) => j !== i)),
                  })),
                ]}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700"
                onClick={fecharFormulario}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
              >
                Salvar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal para upload/edição da foto do artista */}
        <Modal open={showFotoModal} onClose={() => setShowFotoModal(false)} title="Foto do Artista">
          <div className="space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!artistId) return;
                try {
                  setUploadingFoto(true);
                  // Atualiza nome/descrição/tipo
                  await artistFacadeService.atualizarArtista(artistId, nomeArtista, descricaoArtista, tipoArtista);
                  // Se houver arquivo selecionado, envia a foto
                  if (selectedFotoFile) {
                    await artistFacadeService.uploadFotoArtista(artistId, selectedFotoFile);
                  }
                  await artistFacadeService.carregarArtistaById(artistId);
                  setShowFotoModal(false);
                } catch (err) {
                  showApiErrorToast(err, 'Erro ao atualizar artista');
                } finally {
                  setUploadingFoto(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-slate-300">Nome</label>
                <input
                  value={nomeArtista}
                  onChange={(e) => setNomeArtista(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg mt-1 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300">Tipo</label>
                <select
                  value={tipoArtista}
                  onChange={(e) => setTipoArtista(e.target.value as TipoArtista)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg mt-1 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="CANTOR">Cantor</option>
                  <option value="BANDA">Banda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300">Descrição</label>
                <textarea
                  value={descricaoArtista}
                  onChange={(e) => setDescricaoArtista(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg mt-1 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300">Foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFotoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="mt-1 w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-600 file:text-white file:cursor-pointer hover:file:bg-slate-500"
                />
                <ImagePreviewGrid
                  items={[
                    ...(artista?.fotoUrl || artista?.fotoNomeArquivo
                      ? [
                          {
                            id: 'current-foto',
                            url: artista?.fotoUrl ?? '/240x240.png',
                            onRemove: async () => {
                              if (!artistId) return;
                              try {
                                await artistFacadeService.deletarFotoArtista(artistId);
                                await artistFacadeService.carregarArtistaById(artistId);
                              } catch (err) {
                                showApiErrorToast(err, 'Erro ao remover foto');
                              }
                            },
                          },
                        ]
                      : []),
                    ...(selectedFotoFile
                      ? [
                          {
                            id: 'new-foto',
                            url: URL.createObjectURL(selectedFotoFile),
                            onRemove: () => setSelectedFotoFile(null),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700"
                  onClick={() => setShowFotoModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                  disabled={uploadingFoto}
                >
                  {uploadingFoto ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <section>
          <h2 className="text-white font-semibold mb-4">Álbuns</h2>

          {carregando && <div className="text-slate-400">Carregando álbuns...</div>}

          <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {albuns.length === 0 && !carregando ? (
                <div className="text-slate-400">Nenhum álbum encontrado para este artista.</div>
              ) : (
                albuns.map((album) => (
                  <div key={album.id} className="bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden group min-w-0">
                    <div className="aspect-square w-full bg-gray-800 flex items-center justify-center relative">
                      <AlbumCover album={album} />
                      {usuario && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80"
                                onClick={() => abrirFormularioEdicao(album)}
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
                                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-700/80"
                                onClick={() => handleDeleteAlbum(album.id)}
                                aria-label="Excluir álbum"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir álbum</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-white font-medium truncate">{album.titulo}</div>
                      <div className="text-slate-400 text-sm mt-1">{album.dataLancamento ?? ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TooltipProvider>
        </section>
      </div>
    </div>
  );
}

function AlbumCover({ album }: { album: Album }) {
  const url = album.capas?.[0]?.presignedUrl ?? album.capas?.[0]?.url ?? null;
  return <img src={url ?? "/240x240.png"} alt={album.titulo} className="object-cover w-full h-full" />;
}
