import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff, User, Pencil, Shield } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorUtils';
import { toast } from 'sonner';

/**
 * Página de perfil do usuário
 * Exibe dados do usuário e permite editar username/email e alterar senha
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim() || !editEmail.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (editUsername.length < 3 || editUsername.length > 50) {
      toast.error('Username deve ter entre 3 e 50 caracteres');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      toast.error('E-mail inválido');
      return;
    }
    setSavingProfile(true);
    try {
      await authService.atualizarPerfil(editUsername.trim(), editEmail.trim());
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Falha ao atualizar perfil'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.alterarSenha(senhaAtual, novaSenha);
      toast.success('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Falha ao alterar senha'));
    } finally {
      setSavingPassword(false);
    }
  };

  const formatarData = (data?: string) => {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleString('pt-BR');
    } catch {
      return data;
    }
  };

  const formatarRoles = (roles?: string[]) => {
    if (!roles || roles.length === 0) return '-';
    return roles.map((r) => r.replace('ROLE_', '')).join(', ');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-slate-400">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 w-full">
      {/* Header com avatar e nome */}
      <header className="mb-8">
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg ring-4 ring-slate-800">
            <User className="h-10 w-10 text-white/90" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {user.username}
            </h1>
            <p className="text-slate-400 mt-1">{user.email}</p>
            <span
              className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.ativo
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-600/50 text-slate-400'
              }`}
            >
              {user.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Card className="w-full border-slate-700 bg-slate-800/60 shadow-xl overflow-hidden">
        <Tabs defaultValue="conta" className="w-full">
          <div className="border-b border-slate-700 px-4 sm:px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10 bg-slate-700/80 p-1 gap-1">
              <TabsTrigger
                value="conta"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400 rounded-md transition-colors"
              >
                <User className="h-4 w-4 mr-2 shrink-0" />
                Conta
              </TabsTrigger>
              <TabsTrigger
                value="editar"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400 rounded-md transition-colors"
              >
                <Pencil className="h-4 w-4 mr-2 shrink-0" />
                Editar
              </TabsTrigger>
              <TabsTrigger
                value="seguranca"
                className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400 rounded-md transition-colors"
              >
                <Shield className="h-4 w-4 mr-2 shrink-0" />
                Segurança
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="conta" className="mt-0">
            <CardContent className="p-6 sm:p-8">
              <CardTitle className="text-lg text-white mb-1">Informações da conta</CardTitle>
              <CardDescription className="text-slate-400 mb-6">
                Dados da sua conta (somente leitura)
              </CardDescription>
              <div className="grid gap-6 sm:grid-cols-2 items-start">
                <div className="space-y-1">
                  <Label className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                    ID
                  </Label>
                  <p className="text-white font-medium">{user.id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                    Papéis
                  </Label>
                  <p className="text-white font-medium">{formatarRoles(user.roles)}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                    Data de criação
                  </Label>
                  <p className="text-white font-medium">{formatarData(user.createdAt)}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                    Último login
                  </Label>
                  <p className="text-white font-medium">{formatarData(user.lastLogin)}</p>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="editar" className="mt-0">
            <CardContent className="p-6 sm:p-8">
              <CardTitle className="text-lg text-white mb-1">Editar perfil</CardTitle>
              <CardDescription className="text-slate-400 mb-6">
                Atualize seu username e e-mail
              </CardDescription>
              <form onSubmit={handleSalvarPerfil} className="space-y-5 max-w-md mx-auto w-full">
                <div className="space-y-2">
                  <Label htmlFor="profile-username" className="text-slate-300">
                    Username
                  </Label>
                  <Input
                    id="profile-username"
                    type="text"
                    placeholder="seu_usuario"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={savingProfile}
                    className="h-10 bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-500 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="text-slate-300">
                    E-mail
                  </Label>
                  <Input
                    id="profile-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    disabled={savingProfile}
                    className="h-10 bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-500 focus:ring-emerald-500/50"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 px-6"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Salvar alterações
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="seguranca" className="mt-0">
            <CardContent className="p-6 sm:p-8">
              <CardTitle className="text-lg text-white mb-1">Alterar senha</CardTitle>
              <CardDescription className="text-slate-400 mb-6">
                Informe a senha atual e a nova senha para atualizar sua credencial
              </CardDescription>
              <form onSubmit={handleAlterarSenha} className="space-y-5 max-w-md mx-auto w-full">
                <div className="space-y-2">
                  <Label htmlFor="profile-senha-atual" className="text-slate-300">
                    Senha atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="profile-senha-atual"
                      type={showSenhaAtual ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      disabled={savingPassword}
                      className="h-10 bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-500 pr-10 focus:ring-emerald-500/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-slate-600/50 text-slate-400 hover:text-white rounded-l-none"
                      onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    >
                      {showSenhaAtual ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-nova-senha" className="text-slate-300">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="profile-nova-senha"
                      type={showNovaSenha ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      disabled={savingPassword}
                      className="h-10 bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-500 pr-10 focus:ring-emerald-500/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-slate-600/50 text-slate-400 hover:text-white rounded-l-none"
                      onClick={() => setShowNovaSenha(!showNovaSenha)}
                    >
                      {showNovaSenha ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-confirmar-senha" className="text-slate-300">
                    Confirmar nova senha
                  </Label>
                  <Input
                    id="profile-confirmar-senha"
                    type="password"
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={savingPassword}
                    className="h-10 bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-500 focus:ring-emerald-500/50"
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 text-white h-10 px-6"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Alterar senha
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
