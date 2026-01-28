
import React, { useState, useEffect } from 'react';
import { X, MapPin, ChevronLeft, ChevronRight, Save, Loader2, Filter } from 'lucide-react';
import { User, Team } from '../types';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PresencialModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  teams: Team[];
  currentUser: User;
  onSavePresence: (updatedUsers: User[]) => Promise<void>;
}

const PresencialModal: React.FC<PresencialModalProps> = ({ isOpen, onClose, users, teams, currentUser, onSavePresence }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [filterTeamId, setFilterTeamId] = useState<string>('MY_TEAM');

  useEffect(() => {
    if (isOpen) {
      setLocalUsers(users); // Initialize local state with current props
      setHasChanges(false);
      setCurrentDate(new Date());
      setFilterTeamId(currentUser.role === 'COORDINATOR' ? 'ALL' : currentUser.teamId);
    }
  }, [isOpen, users, currentUser]);

  if (!isOpen) return null;

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const handleToggleLocal = (userId: string, dateStr: string) => {
    setHasChanges(true);
    setLocalUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const isPresent = u.presencialDates.includes(dateStr);
        const newDates = isPresent 
           ? u.presencialDates.filter(d => d !== dateStr) 
           : [...u.presencialDates, dateStr];
        return { ...u, presencialDates: newDates };
      }
      return u;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSavePresence(localUsers);
    setIsSaving(false);
    setHasChanges(false);
    onClose();
  };

  // Filter Logic
  const filteredUsers = localUsers.filter(u => {
      if (filterTeamId === 'ALL') return true;
      if (filterTeamId === 'MY_TEAM') return u.teamId === currentUser.teamId;
      return u.teamId === filterTeamId;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 border-b border-indigo-700 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-white shrink-0 gap-4">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin size={20} /> Escala Presencial
             </h2>
             <div className="flex items-center bg-indigo-700 rounded-lg p-0.5 ml-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-indigo-500 rounded transition-colors text-white">
                   <ChevronLeft size={18} />
                </button>
                <span className="px-3 text-sm font-semibold min-w-[120px] text-center capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-indigo-500 rounded transition-colors text-white">
                   <ChevronRight size={18} />
                </button>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-indigo-700 rounded px-2 py-1">
                <Filter size={14} className="text-indigo-300" />
                <select 
                   value={filterTeamId}
                   onChange={e => setFilterTeamId(e.target.value)}
                   className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                >
                    {currentUser.role === 'COORDINATOR' && <option value="ALL" className="text-slate-800">Todas as Equipes</option>}
                    <option value={currentUser.teamId} className="text-slate-800">Minha Equipe</option>
                    {currentUser.role === 'COORDINATOR' && teams.map(t => (
                        <option key={t.id} value={t.id} className="text-slate-800">{t.name}</option>
                    ))}
                </select>
             </div>
             <button onClick={onClose} className="text-indigo-200 hover:text-white ml-auto">
                <X size={20} />
             </button>
          </div>
        </div>

        <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center px-6">
           <span className="text-sm text-indigo-800">
             Clique para alternar: <strong className="text-green-700">Verde (Presencial)</strong> / <strong className="text-slate-500">Cinza (Home Office)</strong>
           </span>
           
           {hasChanges && (
             <span className="text-xs font-bold text-amber-600 animate-pulse">
               • Alterações pendentes
             </span>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isTodayStr = isSameDay(day, new Date());

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
                        {filteredUsers.length === 0 && <div className="text-xs text-slate-400 italic text-center">Ninguém nesta equipe.</div>}
                        {filteredUsers.map(u => {
                           const isPresent = u.presencialDates.includes(dateStr);
                           return (
                             <button 
                               key={u.id} 
                               onClick={() => handleToggleLocal(u.id, dateStr)}
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
        
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
           <button 
             onClick={onClose}
             className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
           >
             Cancelar
           </button>
           <button 
             onClick={handleSave}
             disabled={!hasChanges || isSaving}
             className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {isSaving && <Loader2 size={16} className="animate-spin" />}
             Salvar Alterações
           </button>
        </div>
      </div>
    </div>
  );
};

export default PresencialModal;
