import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Loader2, Eye, EyeOff } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorUtils';
import { toast } from 'sonner';

/**
 * Página de autenticação (Login e Registro)
 * Exibe login e registro em abas; redireciona se já autenticado
 */
const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.username || !loginData.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(loginData);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Credenciais inválidas'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.username || !registerData.email || !registerData.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (registerData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      await register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });
      toast.success('Conta criada com sucesso!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível criar a conta'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh min-h-screen items-center justify-center overflow-y-auto bg-slate-950 p-4 py-6 sm:p-6 sm:py-8">
      <div className="w-full min-w-0 max-w-md animate-fade-in">
        <div className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full sm:mb-4 sm:h-16 sm:w-16">
            <Music className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Music Albums</h1>
          <p className="mt-1.5 text-sm text-slate-400 sm:mt-2 sm:text-base">Gerencie artistas e álbuns musicais</p>
        </div>

        <Card className="min-w-0 border-slate-700 bg-slate-800/60 shadow-xl">
          <Tabs defaultValue="login">
            <CardHeader className="px-4 pb-4 pt-0 sm:px-6">
              <TabsList className="grid h-11 w-full min-w-0 grid-cols-2 bg-slate-700 sm:h-9">
                <TabsTrigger value="login" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8">
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <CardTitle className="text-lg text-white sm:text-xl">Bem-vindo de volta</CardTitle>
                  <CardDescription className="text-sm text-slate-400 sm:text-base">Entre com suas credenciais para acessar</CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-slate-300">Usuário</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="seu_usuario"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      disabled={isLoading}
                      className="h-11 min-h-[44px] bg-slate-700 border-slate-600 text-base text-white placeholder:text-slate-400 sm:h-10 sm:min-h-0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-300">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        disabled={isLoading}
                        className="h-11 min-h-[44px] bg-slate-700 border-slate-600 text-base text-white placeholder:text-slate-400 sm:h-10 sm:min-h-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-slate-600 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="h-11 w-full sm:h-10 sm:text-sm bg-emerald-600 hover:bg-emerald-500" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <CardTitle className="text-lg text-white sm:text-xl">Criar conta</CardTitle>
                  <CardDescription className="text-sm text-slate-400 sm:text-base">Preencha os dados para se cadastrar</CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-slate-300">Usuário</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="seu_usuario"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      disabled={isLoading}
                      className="h-11 min-h-[44px] bg-slate-700 border-slate-600 text-base text-white placeholder:text-slate-400 sm:h-10 sm:min-h-0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-slate-300">E-mail</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      disabled={isLoading}
                      className="h-11 min-h-[44px] bg-slate-700 border-slate-600 text-base text-white placeholder:text-slate-400 sm:h-10 sm:min-h-0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-slate-300">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={isLoading}
                      className="h-11 min-h-[44px] bg-slate-700 border-slate-600 text-base text-white placeholder:text-slate-400 sm:h-10 sm:min-h-0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-slate-300">Confirmar senha</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                      className="h-11 min-h-[44px] bg-slate-700 border-slate-600 text-base text-white placeholder:text-slate-400 sm:h-10 sm:min-h-0"
                    />
                  </div>
                  
                  <Button type="submit" className="h-11 w-full sm:h-10 sm:text-sm bg-emerald-600 hover:bg-emerald-500" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
