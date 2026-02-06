import { useEffect, useState, useCallback } from 'react';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import type { Artista } from '@/types/types';
import ArtistCard from '@/components/common/ArtistCard';
import ArtistCardSkeleton from '@/components/common/ArtistCardSkeleton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
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
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [pagina, setPagina] = useState(0);
  const [tamanho] = useState(12);
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeDebounced, setNomeDebounced] = useState('');
  const [sort, setSort] = useState<'nome' | 'id' | 'createdAt'>('nome');
  const [ordenacao, setOrdenacao] = useState<'ASC' | 'DESC'>('ASC');
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setNomeDebounced(nome), 300);
    return () => clearTimeout(t);
  }, [nome]);

  const carregar = useCallback(
    async (p: number) => {
      setCarregando(true);
      try {
        await artistFacadeService.carregarArtistas(
          p,
          tamanho,
          nomeDebounced || undefined,
          ordenacao,
          sort
        );
      } catch (error) {
        toast.error(getErrorMessage(error, 'Falha ao carregar artistas'));
      } finally {
        setCarregando(false);
      }
    },
    [tamanho, nomeDebounced, ordenacao, sort]
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

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl text-white font-bold">Artistas</h1>
        </header>

        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
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
          <div>
            <Label htmlFor="sort-artistas" className="text-slate-400 text-sm">
              Ordenar por
            </Label>
            <select
              id="sort-artistas"
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
            <Label htmlFor="dir-artistas" className="text-slate-400 text-sm">
              Direção
            </Label>
            <select
              id="dir-artistas"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as typeof ordenacao)}
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

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            className="bg-slate-700 hover:bg-slate-600 text-white"
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
            className="bg-slate-700 hover:bg-slate-600 text-white"
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
