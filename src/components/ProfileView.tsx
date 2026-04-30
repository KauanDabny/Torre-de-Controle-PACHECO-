import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Mail, Shield, Camera, Save, Loader2, User as UserIcon, Moon, Sun, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

export const ProfileView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    avatar: user?.avatar || ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, avatar: base64String }));
      setIsUploading(false);
      toast.success('Imagem carregada localmente. Clique em Salvar para confirmar.');
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await updateProfile({
        name: formData.name,
        avatar: formData.avatar,
        role: formData.role
      });
      
      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="headline-md text-primary-container">Meu Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais e configurações de conta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-outline-variant rounded-3xl p-8 text-center shadow-sm">
            <div className="relative inline-block mb-4">
              <div className="h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 mx-auto relative group">
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="text-white animate-spin" size={24} />
                  </div>
                )}
                <img 
                  src={formData.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary-container text-white rounded-full shadow-lg hover:scale-110 transition-transform z-20"
                title="Trocar foto"
              >
                <Camera size={18} />
              </button>
            </div>
            <h2 className="title-lg text-primary-container truncate">{formData.name}</h2>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{formData.role}</p>
            
            <div className="mt-8 pt-6 border-t border-outline-variant space-y-4 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="text-sm truncate">{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Shield size={16} className="text-slate-400" />
                <span className="text-sm capitalize">{formData.role} Access</span>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-3xl p-6">
            <h4 className="text-sm font-bold text-teal-800 mb-2">Dica de Segurança</h4>
            <p className="text-xs text-teal-700 leading-relaxed">
              Mantenha seu perfil atualizado para que a Torre de Controle possa identificá-lo rapidamente em caso de emergências.
            </p>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-3xl shadow-sm overflow-hidden text-sm sm:text-base">
            <div className="px-8 py-6 border-b border-outline-variant bg-slate-50">
              <h3 className="title-md text-primary-container">Informações Pessoais</h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">E-mail (Permanente)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-outline-variant rounded-xl text-slate-400 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">URL do Avatar</label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={formData.avatar}
                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium transition-all"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Cargo / Função</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium transition-all appearance-none"
                >
                  <option value="operator">Operador de Logística</option>
                  <option value="manager">Gerente de Operações</option>
                  <option value="admin">Administrador do Sistema</option>
                  <option value="driver">Motorista da Frota</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-primary-container text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>

          {/* System Settings Section */}
          <div className="mt-8 bg-white border border-outline-variant rounded-3xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-outline-variant bg-slate-50">
              <h3 className="title-md text-primary-container">Preferências do Sistema</h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-outline-variant rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white border border-outline-variant rounded-xl text-primary-container">
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-container">Tema Visual</h4>
                    <p className="text-xs text-slate-500">Alternar entre modo claro e escuro.</p>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                >
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-outline-variant rounded-2xl opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white border border-outline-variant rounded-xl text-primary-container">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-container">Notificações Push</h4>
                    <p className="text-xs text-slate-500">Receber alertas de atrasos e emergências.</p>
                  </div>
                </div>
                <div className="h-6 w-12 bg-slate-300 rounded-full relative">
                   <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
