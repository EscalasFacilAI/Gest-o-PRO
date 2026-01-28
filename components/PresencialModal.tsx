import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { User } from '../types';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PresencialModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onTogglePresence: (userId: string, dateStr: string) => void;
}

const PresencialModal: React.FC<PresencialModalProps> = ({ isOpen, onClose, users, onTogglePresence }) => {
  if (!isOpen) return null;

  const today = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 border-b border-indigo-700 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
             <MapPin size={20} /> Escala Presencial - {format(today, 'MMMM', { locale: ptBR })}
          </h2>
          <button onClick={onClose} className="text-indigo-200 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-indigo-50 border-b border-indigo-100 text-sm text-indigo-800 text-center">
           Clique em um membro para alternar entre <strong>Presencial</strong> e <strong>Home Office</strong>.
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isTodayStr = isSameDay(day, today);

                return (
                  <div key={dateStr} className={`flex flex-col gap-3 p-4 border rounded-xl bg-white shadow-sm ${isTodayStr ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                        <div className="flex items-baseline gap-1">
                           <span className="text-xl font-bold text-slate-800">{format(day, 'd')}</span>
                           <span className="text-xs uppercase font-bold text-slate-500">{format(day, 'EEE', { locale: ptBR })}</span>
                        </div>
                        {isTodayStr && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">HOJE</span>}
                     </div>
                     
                     <div className="space-y-2">
                        {users.map(u => {
                           const isPresent = u.presencialDates.includes(dateStr);
                           return (
                             <button 
                               key={u.id} 
                               onClick={() => onTogglePresence(u.id, dateStr)}
                               className={`
                                 w-full flex items-center justify-between p-1.5 rounded-lg border transition-all
                                 ${isPresent 
                                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-60 hover:opacity-100'}
                               `}
                             >
                                <div className="flex items-center gap-2">
                                   <img src={u.avatar} className="w-6 h-6 rounded-full" alt=""/>
                                   <span className={`text-xs font-semibold ${isPresent ? 'text-green-800' : 'text-slate-500'}`}>
                                     {u.name.split(' ')[0]}
                                   </span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                             </button>
                           )
                        })}
                     </div>
                  </div>
                )
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PresencialModal;