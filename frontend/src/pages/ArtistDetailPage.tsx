import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import { albumFacadeService } from '@/services/AlbumFacadeService';
import { authService } from '@/services/AuthService';
import type { Artista, Album, Usuario, TipoArtista } from '@/types/types';
import Modal from '@/components/common/Modal';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';

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
        toast.error(getErrorMessage(error, 'Falha ao carregar dados do artista'));
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
    setShowForm(true);
  }

  function abrirFormularioEdicao(album: Album) {
    setEditingAlbum(album);
    setTitulo(album.titulo);
    setDataLancamento(album.dataLancamento ?? undefined);
    setSelectedFiles([]);
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

      if (selectedFiles && selectedFiles.length > 0) {
        await albumFacadeService.uploadCapas(albumResult.id, selectedFiles);
      }

      // Recarregar lista de álbuns
      await albumFacadeService.carregarAlbunsPorArtista(artistId, 0, 12);
      fecharFormulario();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar álbum'));
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
      toast.error(getErrorMessage(err, 'Erro ao deletar álbum'));
    }
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto">
        <button className="text-slate-400 mb-4" onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        {artista ? (
          <header className="mb-6 flex items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className="w-36 h-36 bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                <img
                  src={artista.fotoUrl ?? "/240x240.png"}
                  alt={artista.nome}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl text-white font-bold">{artista.nome}</h1>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-600 text-slate-300">
                    {artista.tipoArtista === 'BANDA' ? 'Banda' : 'Cantor'}
                  </span>
                </div>
                {(artista.biografia ?? artista.descricao) && (
                <p className="text-slate-400 mt-2">{artista.biografia ?? artista.descricao}</p>
              )}
                <p className="text-slate-500 mt-1 text-sm">{artista.quantidadeAlbuns ?? artista.albumCount ?? albuns.length} álbuns</p>
              </div>
            </div>

            <div>
              {/* Botão para adicionar/editar foto do artista */}
              {usuario ? (
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                    onClick={() => {
                      setNomeArtista(artista.nome);
                      setDescricaoArtista((artista.biografia ?? artista.descricao) ?? '');
                      setTipoArtista(artista.tipoArtista ?? 'CANTOR');
                      setSelectedFotoFile(null);
                      setShowFotoModal(true);
                    }}
                  >
                    {artista.fotoUrl || artista.fotoNomeArquivo ? 'Editar' : 'Editar/Adicionar Foto'}
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md"
                    onClick={() => abrirFormularioNovo()}
                  >
                    Novo Álbum
                  </button>
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
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded mt-1 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Data de lançamento</label>
              <input
                type="date"
                value={dataLancamento ?? ''}
                onChange={(e) => setDataLancamento(e.target.value || undefined)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded mt-1 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Capas (png/jpg)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                className="mt-1 text-sm text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={fecharFormulario} className="px-4 py-2 bg-slate-600 text-white rounded">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Salvar
              </button>
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
                  toast.error(getErrorMessage(err, 'Erro ao atualizar artista'));
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded mt-1 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300">Tipo</label>
                <select
                  value={tipoArtista}
                  onChange={(e) => setTipoArtista(e.target.value as TipoArtista)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded mt-1 text-white"
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded mt-1 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300">Foto (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFotoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 bg-slate-600 text-white rounded" type="button" onClick={() => setShowFotoModal(false)}>
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit" disabled={uploadingFoto}>
                  {uploadingFoto ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <section>
          <h2 className="text-white font-semibold mb-4">Álbuns</h2>

          {carregando && <div className="text-slate-400">Carregando álbuns...</div>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albuns.length === 0 && !carregando ? (
              <div className="text-slate-400">Nenhum álbum encontrado para este artista.</div>
            ) : (
              albuns.map((album) => (
                <div key={album.id} className="bg-slate-900/60 border border-slate-700 rounded overflow-hidden">
                  <div className="h-44 w-full bg-gray-800 flex items-center justify-center relative">
                    <AlbumCover album={album} />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {usuario && usuario.roles && usuario.roles.includes('ROLE_ADMIN') && (
                        <>
                          <button
                            onClick={() => abrirFormularioEdicao(album)}
                            className="bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAlbum(album.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium truncate">{album.titulo}</div>
                    <div className="text-slate-400 text-sm mt-1">{album.dataLancamento ?? ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AlbumCover({ album }: { album: Album }) {
  const url = album.capas?.[0]?.presignedUrl ?? album.capas?.[0]?.url ?? null;
  return <img src={url ?? "/240x240.png"} alt={album.titulo} className="object-cover w-full h-44" />;
}
