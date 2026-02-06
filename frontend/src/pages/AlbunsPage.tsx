import { useEffect, useState, useCallback } from 'react';
import { albumFacadeService } from '@/services/AlbumFacadeService';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import type { Album, Artista } from '@/types/types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AlbumCardSkeleton from '@/components/common/AlbumCardSkeleton';
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
  const [albuns, setAlbuns] = useState<Album[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [sort, setSort] = useState<'titulo' | 'dataLancamento' | 'id'>('titulo');
  const [direction, setDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [artistaId, setArtistaId] = useState<number | ''>('');
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
        toast.error(getErrorMessage(error, 'Falha ao carregar álbuns'));
      } finally {
        setCarregando(false);
      }
    },
    [sort, direction, artistaId]
  );

  useEffect(() => {
    artistFacadeService.carregarArtistas(0, 500).catch(() => {
      toast.error(getErrorMessage(null, 'Falha ao carregar artistas'));
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

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl text-white font-bold">Álbuns</h1>
      </header>

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
                <h3 className="text-white font-semibold truncate">{album.titulo}</h3>
                <p className="text-sm text-slate-400 mt-1">{album.artistaNome}</p>
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
