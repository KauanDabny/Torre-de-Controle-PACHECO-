import React, { useState } from 'react';
import { Bell, Check, Trash2, Clock, AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import { useNotifications, FleetNotification } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getTypeIcon = (type: FleetNotification['type']) => {
    switch (type) {
      case 'delay': return <Clock size={16} className="text-amber-500" />;
      case 'stop': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'ignition': return <OctagonAlert size={16} className="text-red-500" />;
      case 'critical': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getRelativeTime = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-slate-600 cursor-pointer hover:text-primary-container transition-colors p-1"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-outline-variant z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                <h3 className="font-bold text-primary-container flex items-center gap-2">
                  <Bell size={18} />
                  Notificações
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={markAllAsRead}
                    className="p-1.5 text-slate-400 hover:text-primary-container hover:bg-slate-100 rounded-lg transition-all"
                    title="Marcar tudo como lido"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={clearNotifications}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Limpar tudo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Nenhuma notificação por enquanto.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/30">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        className={`p-4 flex gap-3 hover:bg-slate-50 transition-all cursor-pointer relative ${!n.read ? 'bg-blue-50/30' : ''}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        {!n.read && (
                          <div className="absolute top-4 right-4 h-2 w-2 bg-blue-500 rounded-full"></div>
                        )}
                        <div className="mt-0.5 shrink-0">
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm tracking-tight leading-tight ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <Clock size={10} className="text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getRelativeTime(n.timestamp)}</span>
                            {n.plate && (
                              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none ml-1">
                                {n.plate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-outline-variant text-center">
                <button className="text-xs font-bold text-primary-container hover:underline uppercase tracking-widest">
                  Ver todas as atualizações
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
