import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search,
  Filter,
  Download,
  MoreVertical,
  Truck,
  Package,
  Wrench,
  MapPin,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Edit2,
  Map as MapIcon,
  List,
  Maximize2,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useShipments } from '../contexts/ShipmentContext';
import { Shipment, FleetVehicle } from '../types';
import toast from 'react-hot-toast';
import { FleetMapView } from './FleetMapView';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const FleetStatusView: React.FC = () => {
  const { vehicles, shipments, loading, addVehicle, updateVehicle, deleteVehicle, syncSascar } = useShipments();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (isFullscreen && scrollRef.current) {
      const container = scrollRef.current;
      let isPaused = false;
      
      scrollInterval = setInterval(() => {
        if (isPaused) return;
        
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
          isPaused = true;
          // Pausa no fim para leitura e reseta para o topo instantaneamente
          setTimeout(() => {
            container.scrollTo({ top: 0, behavior: 'auto' });
            // Pausa breve no topo antes de recomeçar a descida
            setTimeout(() => {
              isPaused = false;
            }, 2000);
          }, 4000);
        } else {
          container.scrollBy({ top: 1, behavior: 'auto' });
        }
      }, 50);
    }
    return () => clearInterval(scrollInterval);
  }, [isFullscreen]);

  const toggleFullScreen = () => {
    const container = containerRef.current;
    if (!container) {
      setIsFullscreen(false);
      return;
    }

    const isCurrentlyFs = !!(
      document.fullscreenElement || 
      (document as any).webkitFullscreenElement || 
      (document as any).mozFullScreenElement || 
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFs) {
      const requestFs = container.requestFullscreen || 
                        (container as any).webkitRequestFullscreen || 
                        (container as any).mozRequestFullScreen || 
                        (container as any).msRequestFullscreen;
      if (requestFs) {
        requestFs.call(container).catch(err => {
          toast.error(`Erro ao ativar tela cheia: ${err.message}`);
        });
      }
    } else {
      const exitFs = document.exitFullscreen || 
                    (document as any).webkitExitFullscreen || 
                    (document as any).mozCancelFullScreen || 
                    (document as any).msExitFullscreen;
      if (exitFs) {
        // Execute exit call and force state update on any outcome
        try {
          const promise = exitFs.call(document);
          if (promise && promise.then) {
            promise.catch(() => setIsFullscreen(false)).finally(() => setIsFullscreen(false));
          } else {
            setIsFullscreen(false);
          }
        } catch (e) {
          setIsFullscreen(false);
        }
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Pair vehicles with their latest shipment
  const fleetData = useMemo(() => {
    return vehicles.map(vehicle => {
      // Find the most recent shipment for this vehicle by plate
      const vehicleShipments = shipments
        .filter(s => s.plate === vehicle.plate)
        .sort((a, b) => {
          const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return dateB - dateA;
        });
      
      const latestShipment = vehicleShipments[0];
      
      // If there is a shipment and it's not finished, it defines the status
      // If the shipment is finished, the vehicle is VAZIO
      const currentShipment = latestShipment && latestShipment.status !== 'ENTREGUE' ? latestShipment : null;
      
      return {
        vehicle,
        latestShipment: currentShipment
      };
    });
  }, [vehicles, shipments]);

  const filteredFleet = useMemo(() => {
    // In Fullscreen mode, show all vehicles unless the user explicitly wants to filter
    // Actually, usually in a monitor dashboard, you want to see everything
    const dataToFilter = isFullscreen ? fleetData : fleetData; // Could bypass filter here if needed
    
    return fleetData.filter(item => {
      // If we are in fullscreen, we skip search/filter to show the whole fleet
      if (isFullscreen) return true;

      const matchesSearch = item.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.vehicle.prefix?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filter === 'Todos') return true;
      
      const status = item.latestShipment?.status || 'VAZIO';
      if (filter === 'Carregados') return ['EM TRÂNSITO', 'CARREGANDO', 'PARADO (PONTO DE APOIO)'].includes(status);
      if (filter === 'Aguardando') return status === 'AGUARDANDO';
      if (filter === 'Vazios') return status === 'VAZIO';
      if (filter === 'Em Manutenção') return status === 'EM MANUTENÇÃO';
      
      return true;
    });
  }, [fleetData, searchTerm, filter, isFullscreen]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const loaded = fleetData.filter(f => ['EM TRÂNSITO', 'CARREGANDO', 'PARADO (PONTO DE APOIO)'].includes(f.latestShipment?.status || '')).length;
    const maintenance = fleetData.filter(f => f.latestShipment?.status === 'EM MANUTENÇÃO').length;
    
    return { total, loaded, maintenance };
  }, [vehicles.length, fleetData]);

  const handleOpenModal = (vehicle: FleetVehicle | null = null) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleSaveVehicle = async (data: Partial<FleetVehicle>) => {
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, data);
        toast.success('Veículo atualizado!');
      } else {
        await addVehicle(data as Omit<FleetVehicle, 'id'>);
        toast.success('Veículo cadastrado!');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao salvar veículo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Deseja realmente excluir este veículo?')) {
      try {
        await deleteVehicle(id);
        toast.success('Veículo excluído');
      } catch (error) {
        toast.error('Erro ao excluir');
      }
    }
  };

  const handleExportExcel = async () => {
    if (filteredFleet.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Frota');

    // Add main top header
    worksheet.mergeCells('A1:G1');
    const mainTitleRow = worksheet.getRow(1);
    mainTitleRow.getCell(1).value = 'TOCOS - TRUCKS';
    mainTitleRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    mainTitleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D3D3D' }
    };
    mainTitleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    mainTitleRow.height = 30;

    // Define columns based on screenshot
    worksheet.getRow(2).values = ['PLACA', 'MOTORISTA', 'CLIENTE', 'ORIGEM', 'DESTINO', 'CARREGAMENTO (ETA)', 'DESCARGA (ETD)'];
    
    // Set column widths
    worksheet.columns = [
      { key: 'plate', width: 15 },
      { key: 'driver', width: 30 },
      { key: 'client', width: 20 },
      { key: 'origin', width: 30 },
      { key: 'destination', width: 30 },
      { key: 'eta', width: 20 },
      { key: 'etd', width: 20 }
    ];

    // Style the column headers (Row 2)
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D3D3D' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 25;

    // Add data
    filteredFleet.forEach(({ vehicle, latestShipment }) => {
      const [origin, destination] = (latestShipment?.route || '').includes(' X ') 
        ? (latestShipment?.route || '').split(' X ').map(s => s.trim())
        : [latestShipment?.route || vehicle.address || '---', '---'];

      const rowData = {
        plate: vehicle.plate,
        driver: latestShipment?.driver || '---',
        client: latestShipment?.client || '---',
        origin: origin || '---',
        destination: destination || '---',
        eta: latestShipment?.collectionTime ? new Date(latestShipment.collectionTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '---',
        etd: latestShipment?.unloadingTime ? new Date(latestShipment.unloadingTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '---'
      };

      const row = worksheet.addRow(rowData);

      // Determine background color based on status to match screenshot visual logic
      const status = latestShipment?.status || 'VAZIO';
      let bgColor = 'FFFFFFFF'; // Default white
      
      if (['EM TRÂNSITO', 'CARREGANDO'].includes(status)) {
        bgColor = 'FFF4CCCC'; // Soft Red/Pink from screenshot
      } else if (status === 'AGUARDANDO') {
        bgColor = 'FFFFE599'; // Soft Yellow from screenshot
      } else if (['VAZIO', 'DISPONÍVEL'].includes(status)) {
        bgColor = 'FFD9EAD3'; // Soft Green
      } else if (status === 'EM MANUTENÇÃO') {
        bgColor = 'FFD9D2E9'; // Soft Purple
      } else if (status === 'PARADO (PONTO DE APOIO)') {
        bgColor = 'FFC9DAF8'; // Soft Blue
      }

      // Apply row styling
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.font = { bold: true, color: { argb: 'FF000000' }, size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `monitoramento_frota_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel exportado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto bg-slate-50 overflow-y-auto h-full">
      {/* Page Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="display-lg text-primary-container">Status da Frota</h2>
          <p className="text-body-sm text-slate-500 font-medium">Monitoramento em tempo real de {stats.total} veículos ativos.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <StatMiniCard 
            icon={<Package size={18} className="text-primary-container" />}
            label="Carregados"
            value={stats.loaded.toString()}
            bgColor="bg-secondary-container"
          />
          <StatMiniCard 
            icon={<Wrench size={18} className="text-tertiary" />}
            label="Em Manutenção"
            value={stats.maintenance.toString()}
            bgColor="bg-tertiary-fixed"
          />
          <button 
            onClick={toggleFullScreen}
            className="bg-white text-slate-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-outline-variant hover:bg-slate-50 transition-all shadow-sm group"
            title="Modo Telão"
          >
            <Maximize2 size={18} className="text-slate-400 group-hover:text-primary-container" /> Modo Telão
          </button>
          <button 
            onClick={syncSascar}
            disabled={loading}
            className="bg-white text-slate-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-outline-variant hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            title="Sincronizar Rastreamento"
          >
            <Activity size={18} className={cn("text-primary-container", loading && "animate-spin")} /> 
            {loading ? 'Sincronizando...' : 'Sincronizar Sascar'}
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary-container text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary-container/20"
          >
            <Plus size={18} /> Novo Veículo
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="bg-white px-4 py-2 rounded-xl border border-outline-variant shadow-sm flex items-center gap-3 flex-1">
            <Search size={18} className="text-slate-400" />
            <input 
              placeholder="Pesquisar por placa ou prefixo..." 
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="p-2.5 bg-white border border-outline-variant rounded-xl text-slate-500 hover:text-primary-container hover:bg-slate-50 transition-all shadow-sm"
            title="Exportar Excel Estilizado"
          >
            <Download size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar whitespace-nowrap">
          {['Todos', 'Carregados', 'Aguardando', 'Vazios', 'Em Manutenção'].map(label => (
            <FilterChip 
              key={label} 
              label={label} 
              active={filter === label} 
              onClick={() => setFilter(label)}
            />
          ))}
        </div>
      </div>

      {/* Fleet List View */}
      <div ref={containerRef} className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col relative">
        {isFullscreen && (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFullScreen();
            }}
            className="fixed md:absolute top-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-2xl transition-all flex items-center justify-center cursor-pointer pointer-events-auto border-2 border-white/50"
            title="Sair do Telão"
          >
            <X size={24} strokeWidth={3} />
          </button>
        )}
        <div ref={scrollRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-100px)] lg:max-h-none">
          <table className="w-full text-left">
            <thead className="bg-surface-container border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 label-caps text-slate-500 font-black text-[10px]">VEÍCULO</th>
                <th className="px-6 py-4 label-caps text-slate-500 font-black text-[10px]">STATUS ATUAL</th>
                <th className="px-6 py-4 label-caps text-slate-500 font-black text-[10px]">CLIENTE / ROTA</th>
                <th className="px-6 py-4 label-caps text-slate-500 font-black text-[10px]">HORÁRIOS DA VIAGEM</th>
                <th className="px-6 py-4 text-right text-[10px] uppercase font-black text-slate-500 pr-10">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredFleet.length > 0 ? (
                filteredFleet.map(({ vehicle, latestShipment }) => (
                  <FleetRow 
                    key={vehicle.id}
                    plate={vehicle.plate}
                    model={vehicle.prefix || 'Caminhão'}
                    status={latestShipment?.status || 'VAZIO'}
                    client={latestShipment?.client}
                    route={latestShipment?.route}
                    driver={latestShipment?.driver}
                    location={vehicle.address}
                    collectionTime={latestShipment?.collectionTime}
                    unloadingTime={latestShipment?.unloadingTime}
                    onEdit={() => handleOpenModal(vehicle)}
                    onDelete={() => handleDeleteVehicle(vehicle.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                    Nenhum veículo encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info & Sascar Status */}
        <div className="px-6 py-4 bg-slate-50 border-t border-outline-variant flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conectado via Sascar API (SOAP)</span>
            </div>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando {filteredFleet.length} de {stats.total} veículos</p>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway: HTTPS://SASINTEGRA.SASCAR.COM.BR</span>
        </div>
      </div>

      {/* Performance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white p-8 rounded-xl border border-outline-variant flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="z-10 flex flex-col items-start h-full">
            <h4 className="title-sm text-primary-container mb-2 font-bold uppercase tracking-tight">Performance da Frota</h4>
            <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
              Monitoramento automatizado de SLA e eficiência de rotas. Dados obtidos em tempo real via telemetria.
            </p>
          </div>
          <div className="z-10 flex gap-4 items-end pl-8">
            <ChartBar height="h-24" />
            <ChartBar height="h-32" />
            <ChartBar height="h-28" />
            <ChartBar height="h-40" active />
            <ChartBar height="h-36" />
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/10 to-transparent pointer-events-none" />
        </div>

        <div className="md:col-span-4 bg-primary-container p-8 rounded-xl flex flex-col justify-between shadow-lg text-white">
          <div>
            <ShieldCheck size={36} className="text-teal-400" />
            <h4 className="title-sm mt-4 font-bold uppercase tracking-tight">Segurança Ativa</h4>
            <p className="text-sm opacity-80 mt-2 font-medium leading-relaxed">
              Todos os dispositivos de rastreio estão operando normalmente. Protocolos de segurança reforçados.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between mt-4">
            <span className="data-mono text-[11px] opacity-60">Sincronizado via Sascar</span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] animate-pulse" />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <VehicleModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSaveVehicle}
          initialData={editingVehicle}
        />
      )}
    </div>
  );
};

const VehicleModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: Partial<FleetVehicle>) => void;
  initialData: FleetVehicle | null;
}> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<FleetVehicle>>(
    initialData || {
      plate: '',
      prefix: '',
      address: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-primary-container/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="title-md font-black text-primary-container uppercase tracking-tight">
              {initialData ? 'Editar Veículo' : 'Novo Veículo'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestão de Ativos da Frota</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Placa</label>
            <input 
              required
              placeholder="ABC-1234"
              value={formData.plate}
              onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-black text-primary-container uppercase tracking-widest"
              maxLength={8}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Prefixo / Modelo</label>
            <input 
              placeholder="Ex: Scania R450"
              value={formData.prefix}
              onChange={e => setFormData({ ...formData, prefix: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Localização Base (Opcional)</label>
            <input 
              placeholder="Ex: Pátio Guarulhos"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container outline-none font-bold"
            />
          </div>


          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-outline-variant text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-container text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary-container/20"
            >
              Salvar Veículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatMiniCard: React.FC<{ icon: React.ReactNode; label: string; value: string; bgColor: string }> = ({ icon, label, value, bgColor }) => (
  <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-4 shadow-sm min-w-[160px]">
    <div className={cn("p-2 rounded-lg", bgColor)}>{icon}</div>
    <div>
      <p className="label-caps !text-[10px] text-slate-500 mb-0.5">{label}</p>
      <p className="title-sm !text-xl text-primary-container font-black">{value}</p>
    </div>
  </div>
);

const FilterChip: React.FC<{ label: string; active?: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
    "px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all",
    active 
      ? "bg-primary-container text-white shadow-lg shadow-primary-container/20" 
      : "bg-white border border-outline-variant text-slate-500 hover:bg-slate-50"
  )}>
    {label}
  </button>
);

const FleetRow: React.FC<{
  plate: string;
  model: string;
  status: string;
  client?: string;
  driver?: string;
  route?: string;
  location?: string;
  collectionTime?: string;
  unloadingTime?: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ plate, model, status, client, driver, route, location, collectionTime, unloadingTime, onEdit, onDelete }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'EM TRÂNSITO':
      case 'ENTREGA FINAL':
        return "bg-red-500 text-white border-red-600 shadow-sm";
      case 'CARREGANDO':
        return "bg-red-500 text-white border-red-600 shadow-sm";
      case 'AGUARDANDO':
        return "bg-yellow-400 text-white border-yellow-500 shadow-sm";
      case 'VAZIO':
      case 'DISPONÍVEL':
        return "bg-green-500 text-white border-green-600 shadow-sm";
      case 'EM MANUTENÇÃO':
        return "bg-slate-400 text-white border-slate-500";
      default:
        return "bg-slate-200 text-slate-600 border-slate-300";
    }
  };

  const getRowStyles = (status: string) => {
    switch (status) {
      case 'EM TRÂNSITO':
      case 'ENTREGA FINAL':
      case 'CARREGANDO':
        return "bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all border-red-400/30";
      case 'AGUARDANDO':
        return "bg-yellow-400 hover:bg-yellow-500 text-white shadow-lg transition-all border-yellow-300/30";
      case 'VAZIO':
      case 'DISPONÍVEL':
        return "bg-emerald-400 hover:bg-emerald-500 text-white shadow-lg transition-all border-emerald-300/30";
      case 'EM MANUTENÇÃO':
        return "bg-slate-400 hover:bg-slate-500 text-white border-slate-300/30";
      default:
        return "hover:bg-slate-50 transition-all border-outline-variant/30";
    }
  };

  const getIconStyles = (status: string) => {
    const isColored = ['EM TRÂNSITO', 'ENTREGA FINAL', 'CARREGANDO', 'AGUARDANDO', 'VAZIO', 'DISPONÍVEL', 'EM MANUTENÇÃO'].includes(status);
    if (isColored) return "bg-white/20 border-white/40 text-white";
    return "bg-surface-container-low border-outline-variant text-slate-400";
  };

  const getSubtextStyles = (status: string) => {
    const isColored = ['EM TRÂNSITO', 'ENTREGA FINAL', 'CARREGANDO', 'AGUARDANDO', 'VAZIO', 'DISPONÍVEL', 'EM MANUTENÇÃO'].includes(status);
    return isColored ? "text-white/80" : "text-slate-500";
  };

  const getMainTextStyles = (status: string) => {
    const isColored = ['EM TRÂNSITO', 'ENTREGA FINAL', 'CARREGANDO', 'AGUARDANDO', 'VAZIO', 'DISPONÍVEL', 'EM MANUTENÇÃO'].includes(status);
    return isColored ? "text-white font-black" : "text-primary-container font-black";
  };

  return (
    <tr className={cn("transition-all duration-300 group border-b", getRowStyles(status))}>
      <td className="px-6 py-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all shadow-sm",
            getIconStyles(status)
          )}>
            <Truck size={24} />
          </div>
          <div>
            <p className={cn("text-xl tracking-tighter font-black", getMainTextStyles(status))}>{plate}</p>
            <p className={cn("text-[10px] uppercase tracking-widest font-black leading-none", getSubtextStyles(status))}>{model}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-6 font-black">
        <span className={cn(
          "px-4 py-2 rounded-xl font-black text-[11px] tracking-widest border border-white/30 uppercase shadow-lg inline-block bg-white/20",
        )}>
          {status}
        </span>
      </td>
      <td className="px-6 py-6 border-l border-white/10">
        <div className="flex flex-col gap-2">
          {client ? (
            <div className="space-y-1">
              <p className={cn("text-xs flex items-center gap-2 uppercase tracking-tight font-black", getMainTextStyles(status))}>
                <Building2 size={14} className={cn(getSubtextStyles(status))} /> {client}
              </p>
              {driver && (
                <p className={cn("text-xs font-black flex items-center gap-2", getMainTextStyles(status))}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Motorista: <span className="uppercase">{driver}</span>
                </p>
              )}
            </div>
          ) : (
             <p className={cn("text-[10px] font-black uppercase tracking-widest", getSubtextStyles(status))}>VEÍCULO DISPONÍVEL</p>
          )}
          <div className="pt-1 border-t border-white/10 mt-1">
            <p className={cn("text-xs flex items-center gap-2 font-black uppercase", getMainTextStyles(status))}>
              <MapPin size={14} className={cn(getSubtextStyles(status))} /> {route || location || 'Localização não informada'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-6 border-l border-white/10">
        <div className="space-y-2 flex flex-col font-black">
          <div className="flex flex-col">
            <span className={cn("text-[10px] uppercase tracking-widest mb-1", getSubtextStyles(status))}>Coleta:</span>
            <span className={cn("text-sm", getMainTextStyles(status))}>
              {collectionTime ? new Date(collectionTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={cn("text-[10px] uppercase tracking-widest mb-1", getSubtextStyles(status))}>Descarga:</span>
            <span className={cn("text-sm", getMainTextStyles(status))}>
              {unloadingTime ? new Date(unloadingTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-6 py-6 text-right pr-6">
        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-2 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ChartBar: React.FC<{ height: string; active?: boolean }> = ({ height, active }) => (
  <div className={cn(
    "w-8 rounded-t-lg transition-all duration-500",
    height,
    active ? "bg-primary-container shadow-[0_0_15px_rgba(13,61,61,0.3)]" : "bg-secondary-container"
  )} />
);

