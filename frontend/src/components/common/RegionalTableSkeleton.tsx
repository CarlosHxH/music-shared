import { Skeleton } from '@/components/ui/skeleton';

const ROWS = 8;

/** Skeleton da tabela de regionais para estado de carregamento */
export default function RegionalTableSkeleton() {
  return (
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
          {Array.from({ length: ROWS }).map((_, i) => (
            <tr key={i} className="border-b border-slate-700/50">
              <td className="px-6 py-4">
                <Skeleton className="h-5 w-32 bg-slate-700" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-5 w-12 bg-slate-700" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-5 w-40 bg-slate-700" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
