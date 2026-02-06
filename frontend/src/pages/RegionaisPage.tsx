import { useEffect, useState, useMemo } from 'react';
import { regionalFacadeService } from '@/services/RegionalFacadeService';
import { useAuth } from '@/contexts/AuthContext';
import type { Regional } from '@/types/types';
import { toast } from 'sonner';
import { showApiErrorToast } from '@/lib/errorUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RegionalTableSkeleton from '@/components/common/RegionalTableSkeleton';

/**
 * Formata data ISO para exibição
 */
function formatarData(iso?: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

const SORT_OPTIONS = [
  { value: 'nome', label: 'Nome' },
  { value: 'dataSincronizacao', label: 'Data sincronização' },
] as const;

/**
 * Página de listagem de regionais
 * Tabela com nome, ativo, dataSincronizacao. Filtros e ordenação client-side.
 */
export default function RegionaisPage() {
  const [regionais, setRegionais] = useState<Regional[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'' | 'true' | 'false'>('');
  const [sortBy, setSortBy] = useState<'nome' | 'dataSincronizacao'>('nome');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const { isAdmin } = useAuth();

  const regionaisFiltradas = useMemo(() => {
    let result = [...regionais];

    if (filtroNome.trim()) {
      const termo = filtroNome.trim().toLowerCase();
      result = result.filter((r) => r.nome.toLowerCase().includes(termo));
    }

    if (filtroAtivo === 'true') {
      result = result.filter((r) => r.ativo);
    } else if (filtroAtivo === 'false') {
      result = result.filter((r) => !r.ativo);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'nome') {
        cmp = (a.nome ?? '').localeCompare(b.nome ?? '');
      } else {
        const da = a.dataSincronizacao ? new Date(a.dataSincronizacao).getTime() : 0;
        const db = b.dataSincronizacao ? new Date(b.dataSincronizacao).getTime() : 0;
        cmp = da - db;
      }
      return sortDir === 'ASC' ? cmp : -cmp;
    });

    return result;
  }, [regionais, filtroNome, filtroAtivo, sortBy, sortDir]);

  useEffect(() => {
    const sub = regionalFacadeService.obterRegionais().subscribe(setRegionais);
    carregar();
    return () => sub.unsubscribe();
  }, []);

  async function carregar() {
    setCarregando(true);
    try {
      await regionalFacadeService.carregarRegionais();
    } catch (error) {
      showApiErrorToast(error, 'Falha ao carregar regionais');
    } finally {
      setCarregando(false);
    }
  }

  async function sincronizar() {
    setCarregando(true);
    try {
      await regionalFacadeService.sincronizar();
      toast.success('Sincronização concluída');
    } catch (error) {
      showApiErrorToast(error, 'Falha ao sincronizar regionais');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-w-0">
      <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl text-white font-bold truncate">Regionais</h1>
        {isAdmin && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={sincronizar}
            disabled={carregando}
          >
            {carregando ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        )}
      </header>

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 sm:min-w-[180px]">
          <Label htmlFor="filtro-nome-regionais" className="text-slate-400 text-sm">
            Buscar por nome
          </Label>
          <Input
            id="filtro-nome-regionais"
            type="text"
            placeholder="Digite o nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="mt-1 bg-slate-800 border-slate-600 text-white"
          />
        </div>
        <div className="min-w-0 sm:min-w-[120px]">
          <Label htmlFor="filtro-ativo" className="text-slate-400 text-sm">
            Status
          </Label>
          <select
            id="filtro-ativo"
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value as typeof filtroAtivo)}
            className="mt-1 h-9 w-full sm:w-auto rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
        <div className="min-w-0 sm:min-w-[160px]">
          <Label htmlFor="sort-regionais" className="text-slate-400 text-sm">
            Ordenar por
          </Label>
          <select
            id="sort-regionais"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
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
          <Label htmlFor="dir-regionais" className="text-slate-400 text-sm">
            Ordenação
          </Label>
          <select
            id="dir-regionais"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as typeof sortDir)}
            className="mt-1 h-9 w-full sm:w-auto rounded-md border border-slate-600 bg-slate-700 px-3 text-white"
          >
            <option value="ASC">A-Z</option>
            <option value="DESC">Z-A</option>
          </select>
        </div>
      </div>

      <Card className="bg-slate-800/60 border-slate-700 overflow-hidden">
        <CardContent className="p-0">
        {carregando && regionais.length === 0 ? (
          <RegionalTableSkeleton />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Nome</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Ativo</th>
                <th className="text-left px-6 py-4 text-slate-400 font-medium">Data Sincronização</th>
              </tr>
            </thead>
            <tbody>
              {regionaisFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-slate-400 text-center">
                    Nenhuma regional encontrada.
                  </td>
                </tr>
              ) : (
                regionaisFiltradas.map((r) => (
                  <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                    <td className="px-6 py-4 text-white font-medium">{r.nome}</td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          r.ativo
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }
                      >
                        {r.ativo ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-400 text-xs sm:text-sm whitespace-nowrap">
                      {formatarData(r.dataSincronizacao)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
