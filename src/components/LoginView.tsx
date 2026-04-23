import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Truck, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Programador de Carga');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    // Simulate a bit of network delay for effect
    setTimeout(() => {
      login(name, role);
      setIsLoading(false);
    }, 800);
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
                alt="Transportadora Pacheco" 
                className="h-32 w-auto object-contain"
                onError={(e) => {
                  // Fallback if the logo URL is not accessible
                  e.currentTarget.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop";
                }}
              />
            </div>
            <h2 className="display-lg text-primary-container tracking-tighter">Bem-vindo</h2>
            <p className="text-slate-500 text-sm font-medium">Acesse o Hub Logístico TransPacheco</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Nome do Usuário
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Pacheco"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Cargo / Perfil
              </label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all font-medium appearance-none cursor-pointer"
              >
                <option>Programador de Carga</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !name.trim()}
              className="w-full bg-primary-container text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary-container/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Entrar no Sistema <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-outline-variant flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">
              Acesso Restrito & Criptografado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
