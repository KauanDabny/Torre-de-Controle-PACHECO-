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
  Truck as TruckIcon
} from 'lucide-react';
import { useShipments } from '../contexts/ShipmentContext';
import { cn } from '../lib/utils';
import { Shipment, ShipmentStatus } from '../types';

export const ShipmentsView: React.FC = () => {
  const { shipments, addShipment, updateShipment, deleteShipment, syncSascar } = useShipments();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredShipments = shipments.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.plate.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="display-lg text-primary-container">Gestão de Envios</h2>
          <p className="text-slate-500 text-sm font-medium">Controle total sobre os lançamentos e status das viagens.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary-container text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-900/10 hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={20} />
          Lançar Nova Viagem
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por ID, Veículo ou Placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50">
            <Filter size={18} />
            Filtrar
          </button>
          <button className="flex-1 md:flex-none px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50">
            Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-outline-variant text-[11px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Identificador</th>
                <th className="px-6 py-4">Veículo / Placa</th>
                <th className="px-6 py-4">Rota / Cliente</th>
                <th className="px-6 py-4">Status / Progresso</th>
                <th className="px-6 py-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredShipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-outline-variant/30 text-slate-400">
                        <QrCode size={18} />
                      </div>
                      <div>
                         <p className="font-mono text-primary-container font-black">{s.id}</p>
                         <p className="text-[10px] text-slate-400 font-medium">Att: {s.lastUpdate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{s.vehicle}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{s.plate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm font-bold text-primary-container gap-2">
                       <span>{s.route.split(' → ')[0]}</span>
                       <ArrowRight size={14} className="text-slate-300" />
                       <span>{s.route.split(' → ')[1]}</span>
                    </div>
                    {s.client && <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">{s.client}</p>}
                  </td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-2 py-0.5 text-[9px] font-black rounded-full border border-current/10 mb-2 inline-block",
                       getStatusStyle(s.status)
                     )}>{s.status}</span>
                     <div className="flex items-center gap-2">
                       <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                         <div className={cn("h-full", getProgressColor(s.status))} style={{ width: `${s.progress}%` }}></div>
                       </div>
                       <span className="text-[10px] font-mono text-slate-500">{s.progress}%</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 shrink-0">
                      <button 
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 text-slate-400 hover:text-primary-container hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(s.id)}
                        className="p-2 text-slate-400 hover:text-error hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nenhum envio encontrado para sua busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ShipmentModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={(data) => {
            if (editingShipment) {
              updateShipment(editingShipment.id, data);
            } else {
              addShipment(data as Shipment);
            }
            setIsModalOpen(false);
          }}
          initialData={editingShipment}
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
  const [formData, setFormData] = useState<Partial<Shipment>>(initialData || {
    id: `PACHECO-${Math.floor(1000 + Math.random() * 9000)}`,
    vehicle: '',
    plate: '',
    route: '',
    status: 'AGUARDANDO',
    progress: 0,
    client: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-outline-variant flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-primary-container flex items-center gap-2">
            <TruckIcon className="text-primary-container" />
            {initialData ? 'Editar Viagem' : 'Lançar Nova Viagem'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">ID Viagem</label>
              <input 
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-bold text-primary-container"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Placa</label>
              <input 
                placeholder="ABC-1234"
                value={formData.plate}
                onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Veículo / Modelo</label>
            <input 
              placeholder="Ex: Scania R450"
              value={formData.vehicle}
              onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Rota (Origem → Destino)</label>
            <input 
              placeholder="Ex: São Paulo → Porto Alegre"
              value={formData.route}
              onChange={e => setFormData({ ...formData, route: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Cliente</label>
            <input 
              placeholder="Nome da empresa ou cliente"
              value={formData.client}
              onChange={e => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-medium"
            />
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

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-outline-variant rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-container text-white rounded-xl font-bold shadow-lg shadow-teal-900/20 hover:opacity-90"
            >
              {initialData ? 'Salvar Alterações' : 'Lançar Viagem'}
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
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const getProgressColor = (status: ShipmentStatus) => {
  switch (status) {
    case 'EM TRÂNSITO': return 'bg-teal-500';
    case 'ENTREGA FINAL': return 'bg-blue-500';
    case 'PARADO (PONTO DE APOIO)': return 'bg-amber-500';
    case 'CARREGANDO': return 'bg-purple-500';
    default: return 'bg-slate-400';
  }
};
