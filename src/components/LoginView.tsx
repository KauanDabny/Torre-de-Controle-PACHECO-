import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Truck, ShieldCheck, ArrowRight, Loader2, MailCheck, AlertTriangle } from 'lucide-react';
import { isPlaceholder } from '../lib/supabase';

export const LoginView: React.FC = () => {
  const { login, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !fullName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, { full_name: fullName });
        if (error) {
          setError(error.message);
        } else {
          setError('Conta criada! Agora você pode fazer o login.');
          setIsSignUp(false);
          // Optional: Clear password after success
          setPassword('');
        }
      } else {
        const { error } = await login(email, password);
        if (error) {
          setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-container flex items-center justify-center p-4 selection:bg-teal-400 selection:text-primary-container">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://transportadorapacheco.com/logo.png" 
                alt="Torre De Controle" 
                className="h-32 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop";
                }}
              />
            </div>
            <h2 className="display-lg text-primary-container tracking-tighter">
              {isSignUp ? 'Criar Conta' : 'Login'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Torre De Controle</p>
          </div>

          {isPlaceholder && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Ambiente não configurado</p>
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Para acessar o sistema, é necessário configurar as variáveis <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> nas configurações.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Nome Completo
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                E-mail Corporativo
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@parceiro.com.br"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Senha
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-xs font-bold ${error.includes('Conta criada') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || !email.trim() || !password.trim() || (isSignUp && !fullName.trim())}
              className="w-full bg-primary-container text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary-container/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Cadastrar Agora' : 'Entrar no Sistema'} <ArrowRight size={18} />
                </>
              )}
            </button>


          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-container transition-colors"
            >
              {isSignUp ? 'Já tenho uma conta → Login' : 'Não tem conta? → Cadastrar'}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-outline-variant flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">
              Acesso via Supabase Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
