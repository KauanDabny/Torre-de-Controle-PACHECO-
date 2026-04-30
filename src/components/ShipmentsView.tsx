import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ArrowRight,
  QrCode,
  X,
  Truck as TruckIcon,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Clock,
  ChevronRight,
  Eye,
  Loader2,
  Users,
  UserPlus,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useShipments } from '../contexts/ShipmentContext';
import { cn } from '../lib/utils';
import { Shipment, ShipmentStatus } from '../types';

const STATUS_COLUMNS: { status: ShipmentStatus; label: string; color: string }[] = [
  { status: 'AGUARDANDO', label: 'Aguardando', color: 'slate' },
  { status: 'CARREGANDO', label: 'Carregando', color: 'purple' },
  { status: 'EM TRÂNSITO', label: 'Em Trânsito', color: 'teal' },
  { status: 'PARADO (PONTO DE APOIO)', label: 'Parado', color: 'amber' },
  { status: 'ENTREGA FINAL', label: 'Finalizado', color: 'blue' },
];

export const ShipmentsView: React.FC = () => {
  const { 
    shipments, 
    addShipment, 
    updateShipment, 
    deleteShipment, 
    syncSascar, 
    drivers, 
    addDriver, 
    addClient,
    addRoute,
    uniqueClients, 
    uniqueRoutes 
  } = useShipments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [isRoutesModalOpen, setIsRoutesModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const filteredShipments = shipments.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingShipment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteShipment(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Search and Main Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="bg-white px-4 py-2 rounded-xl border border-outline-variant shadow-sm flex items-center gap-3 flex-1 w-full max-w-2xl">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por ID, Veículo, Placa ou Rota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
          />
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'list' ? "bg-primary-container text-white shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'board' ? "bg-primary-container text-white shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsDriversModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Users size={16} />
            Motoristas
          </button>
          <button 
            onClick={() => setIsClientsModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <UserIcon size={16} />
            Clientes
          </button>
          <button 
            onClick={() => setIsRoutesModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <MapPin size={16} />
            Rotas
          </button>
          <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <Filter size={16} />
            Filtrar
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none bg-primary-container text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-teal-900/10 hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Lançar Viagem
          </button>
        </div>
      </div>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Table Header Section */}
            <div className="flex justify-between items-center px-4">
              <h3 className="text-slate-500 font-bold text-sm">Viagens Ativas</h3>
              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>{shipments.filter(s => s.status === 'EM TRÂNSITO').length} EM TRÂNSITO</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{shipments.filter(s => s.status === 'AGUARDANDO').length} AGUARDANDO</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC]/50 border-b border-outline-variant text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <tr>
                      <th className="px-8 py-5">PLACA</th>
                      <th className="px-8 py-5">MOTORISTA & VEÍCULO</th>
                      <th className="px-8 py-5">ROTA / CLIENTE</th>
                      <th className="px-8 py-5">COLETA / DESCARGA</th>
                      <th className="px-8 py-5">STATUS & PROGRESSO</th>
                      <th className="px-8 py-5 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {filteredShipments.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="space-y-1">
                             <div className="bg-slate-100 px-3 py-1 rounded-lg w-fit">
                               <p className="font-mono text-primary-container font-black text-sm tracking-tighter">{s.plate}</p>
                             </div>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest pl-1">#{s.id.substring(0, 3)}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-700">{s.driver || 'Não Atribuído'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{s.vehicle}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center text-sm font-black text-slate-600 gap-2">
                             <span className="whitespace-nowrap">{s.route.split(' → ')[0]}</span>
                             <ArrowRight size={14} className="text-slate-300" />
                             <span className="whitespace-nowrap">{s.route.split(' → ')[1]}</span>
                          </div>
                          {s.client && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                              {s.client}
                            </p>
                          )}
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1.5 flex flex-col">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Coleta:</span>
                               <span className="text-[11px] font-bold text-slate-700">
                                 {s.collectionTime ? new Date(s.collectionTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
                               </span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Descarga:</span>
                               <span className="text-[11px] font-bold text-slate-700">
                                 {s.unloadingTime ? new Date(s.unloadingTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
                               </span>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-6">
                             <div className="flex flex-col gap-2 flex-grow max-w-[200px]">
                               <div className="flex justify-between items-center text-[10px] font-black">
                                 <span className={cn(
                                   "px-2 py-0.5 rounded-full border border-current/10 font-black tracking-widest",
                                   getStatusStyle(s.status)
                                 )}>{s.status}</span>
                                 <span className="text-slate-700 font-mono">{s.progress}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${s.progress}%` }}
                                   className={cn("h-full rounded-full transition-all duration-1000", getProgressColor(s.status))} 
                                 />
                               </div>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-1 shrink-0">
                            <button 
                              onClick={() => handleOpenEdit(s)}
                              className="p-2.5 text-slate-400 hover:text-primary-container hover:bg-slate-100 rounded-xl transition-all"
                              title="Visualizar/Editar"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(s.id);
                              }}
                              className="p-2.5 text-slate-400 hover:text-error hover:bg-red-50 rounded-xl transition-all"
                              title="Remover"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredShipments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-300">
                            <Package size={48} strokeWidth={1} />
                            <p className="text-xs font-black uppercase tracking-widest">Nenhum envio localizado</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="board"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          >
            {STATUS_COLUMNS.map((column) => {
              const columnShipments = filteredShipments.filter(s => s.status === column.status);
              return (
                <div key={column.status} className="flex-shrink-0 w-[340px] space-y-4">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-outline-variant/50">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
                        column.color === 'slate' && "bg-slate-400",
                        column.color === 'purple' && "bg-purple-500",
                        column.color === 'teal' && "bg-teal-500",
                        column.color === 'amber' && "bg-amber-500",
                        column.color === 'blue' && "bg-blue-500",
                      )}>
                        <div className="w-1 h-1 bg-white rounded-full opacity-60" />
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {column.label}
                      </h3>
                    </div>
                    <span className="text-[10px] font-black bg-white border border-outline-variant text-slate-400 px-2 py-0.5 rounded-lg">
                      {columnShipments.length}
                    </span>
                  </div>

                  <div className="space-y-4 min-h-[200px]">
                    {columnShipments.map((s) => (
                      <motion.div
                        layoutId={s.id}
                        key={s.id}
                        className="bg-white p-6 rounded-[24px] border border-outline-variant shadow-sm hover:shadow-xl hover:border-primary-container/30 transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => handleOpenEdit(s)}
                      >
                        {/* Status Accents */}
                        <div className={cn(
                          "absolute top-0 left-0 w-1.5 h-full",
                          column.color === 'slate' && "bg-slate-200",
                          column.color === 'purple' && "bg-purple-500",
                          column.color === 'teal' && "bg-teal-500",
                          column.color === 'amber' && "bg-amber-500",
                          column.color === 'blue' && "bg-blue-500",
                        )} />

                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-outline-variant/30 text-slate-400 group-hover:bg-primary-container group-hover:text-white transition-all transform group-hover:rotate-6">
                              <QrCode size={18} />
                            </div>
                            <div>
                               <p className="font-mono text-primary-container font-black text-sm tracking-tight">#{s.id.substring(0, 3)}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Atualizado {s.lastUpdate}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-dotted border-outline-variant">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                              <TruckIcon size={18} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-black text-slate-700 truncate leading-tight">{s.vehicle}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest mt-1 opacity-70">{s.plate}</p>
                            </div>
                          </div>

                          <div className="space-y-3 px-1">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-xs font-black text-primary-container">
                                <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[10px]">{s.route.split(' → ')[0].substring(0, 3)}</span>
                                <ArrowRight size={12} className="text-slate-300" />
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">{s.route.split(' → ')[1].substring(0, 3)}</span>
                                <span className="text-[10px] text-slate-400 font-bold truncate ml-auto">{s.route}</span>
                              </div>
                            </div>
                            
                            {s.client && (
                              <div className="flex items-center gap-2 bg-primary-container/5 px-2.5 py-1.5 rounded-lg w-fit">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                                <p className="text-[10px] text-primary-container font-black uppercase tracking-tight truncate">{s.client}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <div className="bg-slate-50 p-2 rounded-xl border border-outline-variant/30">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Coleta</p>
                                <p className="text-[10px] font-bold text-slate-700">
                                  {s.collectionTime ? new Date(s.collectionTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </p>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-xl border border-outline-variant/30">
                                <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Descarga</p>
                                <p className="text-[10px] font-bold text-slate-700">
                                  {s.unloadingTime ? new Date(s.unloadingTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-4 border-t border-slate-50">
                            <div className="flex justify-between items-center text-[10px] font-black tracking-widest">
                              <span className="text-slate-300 uppercase">Progresso da Viagem</span>
                              <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{s.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${s.progress}%` }}
                                className={cn("h-full rounded-full transition-all duration-1000", getProgressColor(s.status))} 
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {columnShipments.length === 0 && (
                      <div className="h-40 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-2 opacity-40">
                         <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                            <Plus size={16} className="text-slate-300" />
                         </div>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Sem demandas</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ShipmentModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={async (data) => {
            const loadingToast = toast.loading(editingShipment ? 'Atualizando viagem...' : 'Lançando nova viagem...');
            try {
              if (editingShipment) {
                await updateShipment(editingShipment.id, data);
                toast.success('Viagem atualizada com sucesso!', { id: loadingToast });
              } else {
                await addShipment(data as Shipment);
                toast.success('Nova viagem lançada com sucesso!', { id: loadingToast });
              }
              setIsModalOpen(false);
            } catch (error: any) {
              console.error('Error saving shipment:', error);
              toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, { id: loadingToast });
            }
          }}
          initialData={editingShipment}
        />
      )}

      {/* Drivers List Modal */}
      {isDriversModalOpen && (
        <DriversModal 
          onClose={() => setIsDriversModalOpen(false)}
        />
      )}

      {/* Clients List Modal */}
      {isClientsModalOpen && (
        <DataListModal 
          title="Gestão de Clientes"
          icon={<UserIcon />}
          items={uniqueClients}
          onClose={() => setIsClientsModalOpen(false)}
          onAdd={addClient}
        />
      )}

      {/* Routes List Modal */}
      {isRoutesModalOpen && (
        <DataListModal 
          title="Gestão de Rotas"
          icon={<MapPin />}
          items={uniqueRoutes}
          onClose={() => setIsRoutesModalOpen(false)}
          onAdd={addRoute}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-primary-container mb-2">Excluir Viagem?</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">Esta ação não pode ser desfeita. Deseja realmente remover este registro?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-outline-variant rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-error text-white rounded-xl font-bold hover:opacity-90"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShipmentModal: React.FC<{ 
  onClose: () => void; 
  onSubmit: (data: Partial<Shipment>) => void;
  initialData?: Shipment | null;
}> = ({ onClose, onSubmit, initialData }) => {
  const { vehicles, drivers, addDriver, uniqueClients, uniqueRoutes } = useShipments();
  const [formData, setFormData] = useState<Partial<Shipment>>(
    initialData 
      ? { ...initialData, id: initialData.id.substring(0, 3) } 
      : {
          id: Math.random().toString(36).substring(2, 5).toUpperCase(),
          vehicle: '',
          plate: '',
          route: '',
          status: 'AGUARDANDO',
          progress: 0,
          client: '',
          driver: '',
          collectionTime: '',
          unloadingTime: ''
        }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  const [isPlateDropdownOpen, setIsPlateDropdownOpen] = useState(false);
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.prefix?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(driverSearchTerm.toLowerCase())
  );

  const filteredRoutesSuggestions = uniqueRoutes.filter(r => 
    r.toLowerCase().includes(routeSearchTerm.toLowerCase())
  );

  const filteredClientsSuggestions = uniqueClients.filter(c => 
    c.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const handleSelectPlate = (vehicle: any) => {
    setFormData({ 
      ...formData, 
      plate: vehicle.plate,
      vehicle: vehicle.prefix || formData.vehicle
    });
    setSearchTerm(vehicle.plate);
    setIsPlateDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <div className="px-8 py-6 border-b border-outline-variant flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-primary-container flex items-center gap-2">
            <TruckIcon className="text-primary-container" />
            {initialData ? 'Editar Viagem' : 'Lançar Nova Viagem'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Identificador (3 Dig.)</label>
              <input 
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value.substring(0, 3).toUpperCase() })}
                required
                maxLength={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-black text-primary-container uppercase tracking-widest"
              />
            </div>
            <div className="space-y-1 relative">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Placa</label>
              <div className="relative">
                <input 
                  placeholder="ABC-1234"
                  value={isPlateDropdownOpen ? searchTerm : formData.plate}
                  onChange={e => {
                    if (!isPlateDropdownOpen) setIsPlateDropdownOpen(true);
                    setSearchTerm(e.target.value.toUpperCase());
                  }}
                  onFocus={() => {
                    setIsPlateDropdownOpen(true);
                    setSearchTerm(formData.plate || '');
                  }}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-mono"
                />
                <AnimatePresence>
                  {isPlateDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 left-0 right-0 mt-1 bg-white border border-outline-variant shadow-xl rounded-xl max-h-48 overflow-y-auto"
                    >
                      {filteredVehicles.length > 0 ? (
                        filteredVehicles.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectPlate(v)}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-outline-variant/30 last:border-0"
                          >
                            <span className="font-mono font-bold text-primary-container">{v.plate}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-black">{v.prefix}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Nenhum veículo encontrado
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isPlateDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsPlateDropdownOpen(false)} 
                />
              )}
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Motorista</label>
            <div className="relative">
              <input 
                placeholder="Nome do motorista"
                value={isDriverDropdownOpen ? driverSearchTerm : formData.driver}
                onChange={e => {
                  if (!isDriverDropdownOpen) setIsDriverDropdownOpen(true);
                  setDriverSearchTerm(e.target.value);
                  setFormData({ ...formData, driver: e.target.value });
                }}
                onFocus={() => {
                  setIsDriverDropdownOpen(true);
                  setDriverSearchTerm(formData.driver || '');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium text-sm"
              />
              <AnimatePresence>
                {isDriverDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-outline-variant shadow-xl rounded-xl max-h-48 overflow-y-auto"
                  >
                    {filteredDrivers.length > 0 ? (
                      filteredDrivers.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, driver: d.name });
                            setIsDriverDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-outline-variant/30 last:border-0"
                        >
                          <span className="font-bold text-slate-700 text-sm">{d.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-black">Selecionar</span>
                        </button>
                      ))
                    ) : driverSearchTerm.length > 2 ? (
                      <div className="px-4 py-3 text-[10px] font-black text-teal-600 uppercase tracking-widest text-center italic">
                        Novo motorista será cadastrado ao salvar
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Digite para pesquisar motoristas
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isDriverDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDriverDropdownOpen(false)} 
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Veículo / Modelo</label>
            <input 
              placeholder="Ex: Scania R450"
              value={formData.vehicle}
              onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium text-sm"
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Rota (Origem → Destino)</label>
            <div className="relative">
              <input 
                placeholder="Ex: São Paulo → Porto Alegre"
                value={isRouteDropdownOpen ? routeSearchTerm : formData.route}
                onChange={e => {
                  if (!isRouteDropdownOpen) setIsRouteDropdownOpen(true);
                  setRouteSearchTerm(e.target.value);
                  setFormData({ ...formData, route: e.target.value });
                }}
                onFocus={() => {
                  setIsRouteDropdownOpen(true);
                  setRouteSearchTerm(formData.route || '');
                }}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium text-sm"
              />
              <AnimatePresence>
                {isRouteDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-outline-variant shadow-xl rounded-xl max-h-48 overflow-y-auto"
                  >
                    {filteredRoutesSuggestions.length > 0 ? (
                      filteredRoutesSuggestions.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, route: r });
                            setIsRouteDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-outline-variant/30 last:border-0"
                        >
                          <span className="font-bold text-slate-700 text-sm">{r}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Digite para cadastrar nova rota
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isRouteDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsRouteDropdownOpen(false)} 
              />
            )}
          </div>

          <div className="space-y-1 relative">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Cliente</label>
            <div className="relative">
              <input 
                placeholder="Nome da empresa ou cliente"
                value={isClientDropdownOpen ? clientSearchTerm : formData.client}
                onChange={e => {
                  if (!isClientDropdownOpen) setIsClientDropdownOpen(true);
                  setClientSearchTerm(e.target.value);
                  setFormData({ ...formData, client: e.target.value });
                }}
                onFocus={() => {
                  setIsClientDropdownOpen(true);
                  setClientSearchTerm(formData.client || '');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium text-sm"
              />
              <AnimatePresence>
                {isClientDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-outline-variant shadow-xl rounded-xl max-h-48 overflow-y-auto"
                  >
                    {filteredClientsSuggestions.length > 0 ? (
                      filteredClientsSuggestions.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, client: c });
                            setIsClientDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between border-b border-outline-variant/30 last:border-0"
                        >
                          <span className="font-bold text-slate-700 text-sm">{c}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Digite para cadastrar novo cliente
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isClientDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsClientDropdownOpen(false)} 
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Horário de Coleta</label>
              <input 
                type="datetime-local"
                value={formData.collectionTime || ''}
                onChange={e => setFormData({ ...formData, collectionTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Horário de Descarga</label>
              <input 
                type="datetime-local"
                value={formData.unloadingTime || ''}
                onChange={e => setFormData({ ...formData, unloadingTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as ShipmentStatus })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-bold text-xs"
              >
                <option value="AGUARDANDO">AGUARDANDO</option>
                <option value="CARREGANDO">CARREGANDO</option>
                <option value="EM TRÂNSITO">EM TRÂNSITO</option>
                <option value="ATRASADO">ATRASADO</option>
                <option value="ENTREGA FINAL">ENTREGA FINAL</option>
                <option value="PARADO (PONTO DE APOIO)">PARADO</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Progresso ({formData.progress}%)</label>
              <input 
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-8 accent-primary-container cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-outline-variant rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-primary-container text-white rounded-xl font-bold shadow-lg shadow-teal-900/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                initialData ? 'Salvar Alterações' : 'Lançar Viagem'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Utils for status styling
const getStatusStyle = (status: ShipmentStatus) => {
  switch (status) {
    case 'EM TRÂNSITO': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'ENTREGA FINAL': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'PARADO (PONTO DE APOIO)': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CARREGANDO': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'AGUARDANDO': return 'bg-slate-50 text-slate-600 border-slate-200';
    case 'ATRASADO': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getProgressColor = (status: ShipmentStatus) => {
  switch (status) {
    case 'EM TRÂNSITO': return 'bg-teal-500';
    case 'ENTREGA FINAL': return 'bg-blue-500';
    case 'PARADO (PONTO DE APOIO)': return 'bg-amber-500';
    case 'CARREGANDO': return 'bg-purple-500';
    case 'ATRASADO': return 'bg-red-600';
    default: return 'bg-slate-400';
  }
};

const DriversModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { drivers, addDriver } = useShipments();
  const [newDriver, setNewDriver] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDriver(newDriver);
      setNewDriver('');
      toast.success('Motorista cadastrado!');
    } catch (error) {
      toast.error('Erro ao cadastrar motorista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] border border-outline-variant shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="px-8 py-6 border-b border-outline-variant flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-primary-container flex items-center gap-2">
            <Users className="text-primary-container" />
            Gestão de Motoristas
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-hidden flex flex-col">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              placeholder="Nome do novo motorista..."
              value={newDriver}
              onChange={e => setNewDriver(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-bold text-sm"
            />
            <button 
              type="submit"
              disabled={isSubmitting || !newDriver}
              className="px-4 py-2.5 bg-primary-container text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2">Motoristas Cadastrados ({drivers.length})</p>
            {drivers.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-outline-variant group hover:border-primary-container/30 transition-all">
                <span className="font-bold text-slate-700">{d.name}</span>
                <Users size={16} className="text-slate-300 group-hover:text-primary-container" />
              </div>
            ))}
            {drivers.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum motorista disponível</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const DataListModal: React.FC<{ 
  onClose: () => void; 
  title: string; 
  icon: React.ReactNode; 
  items: string[];
  onAdd: (item: string) => Promise<void>;
}> = ({ onClose, title, icon, items, onAdd }) => {
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(newValue);
      setNewValue('');
      toast.success(`${title.split(' ').pop()} cadastrado!`);
    } catch (error) {
      toast.error('Erro ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] border border-outline-variant shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="px-8 py-6 border-b border-outline-variant flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-primary-container flex items-center gap-2">
            <span className="text-primary-container">
              {icon}
            </span>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-hidden flex flex-col">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              placeholder={`Nome do novo ${title.split(' ').pop()?.toLowerCase()}...`}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-bold text-sm"
            />
            <button 
              type="submit"
              disabled={isSubmitting || !newValue}
              className="px-4 py-2.5 bg-primary-container text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2">Cadastrados ({items.length})</p>
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-outline-variant group hover:border-primary-container/30 transition-all">
                <span className="font-bold text-slate-700">{item}</span>
                <div className="text-slate-300 group-hover:text-primary-container transition-colors">
                  {icon}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <div className="mx-auto mb-2 opacity-20 flex justify-center scale-150">
                  {icon}
                </div>
                <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <p className="text-[10px] italic text-slate-400 text-center">
              Novos registros também são identificados automaticamente ao lançar uma viagem.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
