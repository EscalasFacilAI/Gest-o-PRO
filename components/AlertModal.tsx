import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { AlertPeriod, AlertColor, normalizeDate, ALERT_COLOR_MAP } from '../types';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alert: AlertPeriod) => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState<AlertColor>('ORANGE');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!label || !startDate || !endDate) return;

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);

    const newAlert: AlertPeriod = {
      id: crypto.randomUUID(),
      startDate: normalizeDate(new Date(sy, sm - 1, sd)),
      endDate: normalizeDate(new Date(ey, em - 1, ed)),
      label,
      color
    };
    onSave(newAlert);
    onClose();
    // Reset form
    setLabel('');
    setStartDate('');
    setEndDate('');
    setColor('ORANGE');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <AlertTriangle size={20} className="text-orange-500" /> Criar Alerta
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo do Alerta</label>
             <input 
               type="text" 
               value={label}
               onChange={e => setLabel(e.target.value)}
               placeholder="Ex: Fechamento, Escala de Fim de Ano..."
               className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
             />
           </div>

           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cor do Indicador</label>
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
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"/>
              </div>
           </div>

           <button 
             onClick={handleSave}
             className="w-full bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-lg shadow-sm mt-2 transition-colors"
           >
             Salvar Alerta
           </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;