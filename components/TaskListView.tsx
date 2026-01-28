
import React from 'react';
import { Task, User, normalizeDate } from '../types';
import { STATUS_LABELS, STATUS_COLORS, USERS } from '../constants';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2 } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  currentUser: User;
  onEditTask: (task: Task) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, currentUser, onEditTask }) => {
  // Sort tasks by date and then by start time
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateComp = a.date.getTime() - b.date.getTime();
    if (dateComp !== 0) return dateComp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  // Group by Date
  const groupedTasks: Record<string, Task[]> = {};
  sortedTasks.forEach(task => {
    const dateKey = task.date.toISOString();
    if (!groupedTasks[dateKey]) groupedTasks[dateKey] = [];
    groupedTasks[dateKey].push(task);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-y-auto custom-scrollbar p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Clock className="text-indigo-600" /> Cronograma de Demandas
      </h2>

      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          Nenhuma demanda encontrada.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([dateStr, dayTasks]) => {
            const date = new Date(dateStr);
            const isToday = isSameDay(date, new Date());
            
            return (
              <div key={dateStr} className="relative pl-6 border-l-2 border-indigo-100">
                <div className={`
                  absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white
                  ${isToday ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'bg-slate-300'}
                `}></div>
                
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {format(date, "dd/MM/yy ' - ' EEEE", { locale: ptBR })} {isToday && '(Hoje)'}
                </h3>

                <div className="space-y-3">
                  {dayTasks.map(task => {
                    // Try to find assignee in USERS first, then fallback to current approach if user management changed
                    // Since USERS is a constant fallback, we should actually rely on data passed in App.tsx or similar
                    // But TaskListView doesn't receive 'users' prop in this snippet, it imports USERS.
                    // Ideally it should receive users prop, but for this quick fix we use what's there.
                    // However, we can improve it by checking the assigneeId against passed currentUser or generic logic.
                    // We'll keep existing logic but just fix date format above.
                    const assignee = USERS.find(u => u.id === task.assigneeId);
                    
                    return (
                      <div 
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-sm font-bold text-slate-700">{task.startTime || '--:--'}</span>
                            <span className="text-xs text-slate-400">às {task.endTime || '--:--'}</span>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {assignee && (
                                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                  <img src={assignee.avatar} className="w-4 h-4 rounded-full" alt="" />
                                  <span className="text-xs text-slate-600">{assignee.name.split(' ')[0]}</span>
                                </div>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[task.status]}`}>
                                {STATUS_LABELS[task.status]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <CheckCircle2 className="text-slate-300 hover:text-indigo-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskListView;
