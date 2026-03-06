import React from 'react';
import { Task, User, TaskStatus } from '../types';
import { format } from 'date-fns';
import { X, Calendar, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { STATUS_LABELS } from '../constants';

interface UserActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  tasks: Task[];
  month: Date;
}

const UserActivitiesModal: React.FC<UserActivitiesModalProps> = ({ isOpen, onClose, user, tasks, month }) => {
  if (!isOpen || !user) return null;

  // Sort tasks by date and time
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.startTime.localeCompare(b.startTime);
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'IN_PROGRESS': return <Clock size={16} className="text-amber-500" />;
      case 'TODO': return <Circle size={16} className="text-slate-400" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200" />
            <div>
              <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
              <p className="text-xs text-slate-500">Relatório de Atividades - {format(month, 'MMMM/yyyy')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-20" />
              <p>Nenhuma atividade registrada neste mês.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task, index) => (
                <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3 hover:border-indigo-200 transition-colors">
                  <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-slate-100 pr-3">
                    <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(task.date), 'EEE')}</span>
                    <span className="text-lg font-bold text-slate-800">{format(new Date(task.date), 'dd')}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                       <h4 className="font-semibold text-slate-800 text-sm truncate pr-2">{task.title}</h4>
                       <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {getStatusIcon(task.status)}
                          <span className="text-[10px] font-bold text-slate-600">{STATUS_LABELS[task.status]}</span>
                       </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{task.startTime} - {task.endTime}</span>
                      </div>
                      {task.priority && (
                         <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                            task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                         }`}>
                            {task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                         </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center text-xs text-slate-500">
           <span>Total: <b>{sortedTasks.length}</b> atividades</span>
           <span>Concluídas: <b>{sortedTasks.filter(t => t.status === 'DONE').length}</b></span>
        </div>
      </div>
    </div>
  );
};

export default UserActivitiesModal;
