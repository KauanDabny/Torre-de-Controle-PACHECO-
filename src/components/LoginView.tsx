import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Truck, ShieldCheck, ArrowRight, Loader2, MailCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setIsLoading(true);
    setError(null);
    try {
      const { error } = await login(email);
      if (error) {
        setError(error.message);
      } else {
        setIsSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao tentar fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-primary-container flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center animate-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 text-green-600 p-4 rounded-full">
              <MailCheck size={48} />
            </div>
          </div>
          <h2 className="display-md text-primary-container mb-4">Link enviado!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Enviamos um link de acesso para <strong>{email}</strong>. 
            Verifique sua caixa de entrada e spam.
          </p>
          <button 
            onClick={() => setIsSent(false)}
            className="text-primary-container font-black text-xs uppercase tracking-widest hover:underline"
          >
            Tentar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-container flex items-center justify-center p-4 selection:bg-teal-400 selection:text-primary-container">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://transportadorapacheco.com/logo.png" 
                alt="Transportadora Pacheco" 
                className="h-32 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop";
                }}
              />
            </div>
            <h2 className="display-lg text-primary-container tracking-tighter">Login</h2>
            <p className="text-slate-500 text-sm font-medium">Hub Logístico TransPacheco (Supabase Auth)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || !email.trim()}
              className="w-full bg-primary-container text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary-container/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Receber Link de Acesso <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-outline-variant flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">
              Login via Supabase OTP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
