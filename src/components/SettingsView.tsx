import React, { useState } from 'react';
import { Settings, Shield, User, Globe, Save, AlertCircle, CheckCircle2, Key, Truck, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useShipments } from '../contexts/ShipmentContext';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('integration');
  const { sascarCredentials, setSascarCredentials, syncSascar, syncStatus } = useShipments();
  
  const [user, setUser] = useState(sascarCredentials.user);
  const [login, setLogin] = useState(sascarCredentials.login);
  const [pass, setPass] = useState(sascarCredentials.pass);
  const [showPass, setShowPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Sync local state when context loads/updates
  React.useEffect(() => {
    setUser(sascarCredentials.user);
    setLogin(sascarCredentials.login);
    setPass(sascarCredentials.pass);
  }, [sascarCredentials]);

  const handleSaveSascar = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      setSascarCredentials({ user, login, pass });
      // Wait for state to sync slightly
      setTimeout(async () => {
        await syncSascar();
        setSaveStatus('success');
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
      }, 500);
    } catch (err) {
      setSaveStatus('error');
      setIsSaving(false);
    }
  };
  
  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'integration', label: 'Integrações', icon: Globe },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h2 className="headline-md text-primary-container">Configurações do Sistema</h2>
          <p className="text-slate-500">Gerencie sua conta e chaves de integração Sascar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tabs Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-primary-container text-white shadow-md shadow-primary-container/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary-container"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          {activeTab === 'integration' && (
            <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex items-center gap-3 bg-slate-50">
                <Globe className="text-primary-container" size={20} />
                <h3 className="font-black text-primary-container uppercase tracking-wider text-sm mt-0.5">Gestão de Integrações</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Truck className="text-primary-container" size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Sascar WebServices</h4>
                      <p className="text-xs text-slate-500 italic">Conectado via API SOAP Oficial</p>
                    </div>
                  </div>
                  {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-in zoom-in-95">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold">Credenciais Salvas!</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <User size={12} />
                      Usuário Sascar
                    </label>
                    <input 
                      type="text"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      placeholder="Ex: PACHECO642"
                      className="w-full bg-slate-50 border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <User size={12} />
                      Login (Canal)
                    </label>
                    <input 
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Ex: ADM"
                      className="w-full bg-slate-50 border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                      <Key size={12} />
                      Senha de Integração
                    </label>
                    <div className="relative">
                      <input 
                        type={showPass ? "text" : "password"}
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container outline-none transition-all pr-12"
                      />
                      <button 
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-container transition-colors"
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-outline-variant rounded-xl p-4 flex gap-3">
                  <AlertCircle className="text-slate-400 shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Onde encontro esses dados?</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Essas são as mesmas credenciais que você usa para acessar o WebService da Sascar. Se não as tiver, solicite ao suporte da Sascar os dados para <b>Integração SOAP</b>.
                    </p>
                  </div>
                </div>

                {/* Diagnostics Panel */}
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnóstico de Conexão</h5>
                    {syncStatus.loading && <div className="h-2 w-2 bg-emerald-400 rounded-full animate-ping"></div>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Status Atual</p>
                      <p className={cn(
                        "text-xs font-bold",
                        syncStatus.error ? "text-red-400" : (syncStatus.lastSync ? "text-emerald-400" : "text-slate-400")
                      )}>
                        {syncStatus.loading ? 'Sincronizando...' : (syncStatus.error ? 'Erro na Conexão' : (syncStatus.lastSync ? 'Conectado' : 'Aguardando Login'))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold">Última Tentativa</p>
                      <p className="text-xs text-slate-300 font-mono">{syncStatus.lastSync || '--:--:--'}</p>
                    </div>
                  </div>

                  {syncStatus.error && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-300 font-mono leading-tight whitespace-pre-wrap overflow-x-auto max-h-80">
                      <div className="flex items-center gap-2 mb-2 text-red-400 font-black uppercase text-[8px] border-b border-red-500/10 pb-1">
                        <AlertCircle size={10} />
                        DETALHE TÉCNICO E LOGS DO SISTEMA
                      </div>
                      {syncStatus.error.includes('\n\nLogs do Sistema:') ? (
                        <>
                          <div className="text-red-400 font-bold mb-2">
                            {syncStatus.error.split('\n\nLogs do Sistema:')[0]}
                          </div>
                          <div className="space-y-1">
                            {syncStatus.error.split('\n\nLogs do Sistema:')[1].trim().split('\n').map((line, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-slate-600 shrink-0">{String(i+1).padStart(2, '0')}</span>
                                <span className={cn(
                                  line.includes('SUCESSO') ? "text-emerald-400 font-bold" : 
                                  line.includes('Falha') || line.includes('Erro') ? "text-rose-400" : "text-slate-400"
                                )}>
                                  {line}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        syncStatus.error
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-outline-variant flex justify-end gap-3">
                <button 
                  onClick={handleSaveSascar}
                  disabled={isSaving}
                  className={cn(
                    "px-8 py-2.5 bg-primary-container text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-95 transition-all",
                    isSaving && "opacity-70 cursor-wait"
                  )}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Ativar Monitoramento
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white border border-outline-variant rounded-2xl shadow-sm p-12 text-center space-y-4">
              <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-2 border-primary-container/20">
                <User size={32} className="text-primary-container" />
              </div>
              <div>
                <h3 className="headline-sm text-slate-800">Em Breve</h3>
                <p className="text-slate-500 text-sm">A edição de perfil estará disponível na próxima atualização.</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-outline-variant rounded-2xl shadow-sm p-12 text-center space-y-4">
              <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="headline-sm text-slate-800">Segurança Ativada</h3>
                <p className="text-slate-500 text-sm">Seu acesso está protegido por autenticação integrada.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
