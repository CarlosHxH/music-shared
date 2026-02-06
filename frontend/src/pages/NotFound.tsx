import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Página 404 - Rota não encontrada
 * Exibe mensagem e botões para voltar ou ir à página inicial
 */
export default function NotFound() {
    const navigate = useNavigate();
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-slate-600">404</h1>
                <h2 className="mt-4 text-3xl font-semibold text-white">
                    Página não encontrada
                </h2>
                <p className="mt-2 text-slate-400 max-w-md mx-auto">
                    A página que você está procurando não existe ou foi removida.
                </p>

                <div className="mt-8 flex items-center justify-center gap-4">
                    <Button
                        onClick={() => navigate(-1)}
                        className="bg-slate-700 hover:bg-slate-600 text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <Button
                        onClick={() => navigate('/artistas')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Página Inicial
                    </Button>
                </div>
            </div>
        </div>
    );
}