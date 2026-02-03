
import React, { useState } from 'react';
import { X, AlertTriangle, Check, Users, Trash2, Pencil } from 'lucide-react';
import { AlertPeriod, AlertColor, normalizeDate, ALERT_COLOR_MAP, Team } from '../types';
import { format } from 'date-fns';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alert: AlertPeriod) => void;
  onDelete?: (alertId: string) => void;
  teams: Team[];
  alertPeriods?: AlertPeriod[];
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, onSave, onDelete, teams, alertPeriods = [] }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState<AlertColor>('ORANGE');
  const [targetTeamId, setTargetTeamId] = useState<string>('ALL');

  if (!isOpen) return null;

  // 2. Filter alerts: Only show active or future alerts (End date >= today)
  // We use normalizeDate to ignore time components.
  const today = normalizeDate(new Date());
  const activeAlerts = alertPeriods.filter(a => normalizeDate(a.endDate) >= today);

  const handleEdit = (alert: AlertPeriod) => {
     setEditingId(alert.id);
     setLabel(alert.label);
     setStartDate(format(alert.startDate, 'yyyy-MM-dd'));
     setEndDate(format(alert.endDate, 'yyyy-MM-dd'));
     setColor(alert.color);
     setTargetTeamId(alert.targetTeamId || 'ALL');
  };

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setStartDate('');
    setEndDate('');
    setColor('ORANGE');
    setTargetTeamId('ALL');
  };

  const handleSave = () => {
    if (!label || !startDate || !endDate) return;

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);

    const newAlert: AlertPeriod = {
      id: editingId || crypto.randomUUID(),
      startDate: normalizeDate(new Date(sy, sm - 1, sd)),
      endDate: normalizeDate(new Date(ey, em - 1, ed)),
      label,
      color,
      targetTeamId
    };
    onSave(newAlert);
    
    resetForm();
    onClose(); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <AlertTriangle size={20} className="text-orange-500" /> Gerenciar Alertas
          </h2>
          <button onClick={() => { onClose(); resetForm(); }} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
           {/* Form Section */}
           <div className={`space-y-4 border-b border-slate-100 pb-6 rounded-lg p-2 ${editingId ? 'bg-indigo-50 border border-indigo-100' : ''}`}>
             <h3 className={`text-sm font-bold flex items-center gap-2 ${editingId ? 'text-indigo-700' : 'text-slate-700'}`}>
               {editingId ? <Pencil size={14} /> : <AlertTriangle size={14}/>}
               {editingId ? 'Editar Alerta' : 'Novo Alerta'}
             </h3>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label>
               <input 
                 type="text" 
                 value={label}
                 onChange={e => setLabel(e.target.value)}
                 placeholder="Ex: Fechamento, Escala de Fim de Ano..."
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
               />
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Visibilidade</label>
                <div className="relative">
                   <select
                     value={targetTeamId}
                     onChange={e => setTargetTeamId(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm appearance-none bg-white"
                   >
                     <option value="ALL">Todas as Equipes</option>
                     {teams.map(t => (
                       <option key={t.id} value={t.id}>{t.name}</option>
                     ))}
                   </select>
                   <Users size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                </div>
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cor</label>
               <div className="flex gap-3">
                  {(Object.keys(ALERT_COLOR_MAP) as AlertColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${ALERT_COLOR_MAP[c].bg.replace('50', '500')}`}
                    >
                      {color === c && <Check size={16} className="text-white" />}
                    </button>
                  ))}
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"/>
                </div>
             </div>

             <div className="flex gap-2">
                {editingId && (
                  <button onClick={resetForm} className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm font-medium py-2 rounded-lg hover:bg-slate-50">
                    Cancelar
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-lg shadow-sm transition-colors"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Alerta'}
                </button>
             </div>
           </div>
           
           {/* List Section - Now only showing active alerts */}
           {activeAlerts.length > 0 && (
              <div className="space-y-2">
                 <h3 className="text-sm font-bold text-slate-700 mt-2">Alertas Ativos</h3>
                 {activeAlerts.map(alert => {
                   const styles = ALERT_COLOR_MAP[alert.color];
                   const isEditing = editingId === alert.id;
                   return (
                     <div 
                        key={alert.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${styles.bg} ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500' : styles.border}`}
                     >
                        <div className="cursor-pointer flex-1" onClick={() => handleEdit(alert)}>
                           <div className={`text-sm font-bold ${styles.text}`}>{alert.label}</div>
                           <div className="text-xs text-slate-500">
                             {format(alert.startDate, 'dd/MM')} até {format(alert.endDate, 'dd/MM')}
                             {alert.targetTeamId && alert.targetTeamId !== 'ALL' && (
                               <span className="ml-1 opacity-75">• Equipe Específica</span>
                             )}
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(alert);
                             }}
                             className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-md border border-transparent hover:border-slate-200"
                             title="Editar"
                          >
                             <Pencil size={16} />
                          </button>
                          {onDelete && (
                            <button 
                               onClick={(e) => {
                                  e.stopPropagation(); 
                                  if(window.confirm('Excluir este alerta?')) onDelete(alert.id);
                               }}
                               className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-md border border-transparent hover:border-slate-200"
                               title="Excluir"
                            >
                               <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                     </div>
                   );
                 })}
              </div>
           )}
           {activeAlerts.length === 0 && alertPeriods.length > 0 && (
              <div className="text-center text-xs text-slate-400 py-4">
                 Todos os alertas estão expirados.
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
