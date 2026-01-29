
import React from 'react';
import { Task, User, Team, normalizeDate, TaskStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2, Users, PlayCircle, Circle } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  currentUser: User;
  users: User[];
  teams: Team[];
  onEditTask: (task: Task) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, currentUser, users, teams, onEditTask }) => {
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

  const handleQuickStatusUpdate = (e: React.MouseEvent, task: Task) => {
     e.stopPropagation();
     // If it's a team task, toggle MY status
     const team = teams.find(t => t.id === task.assigneeId);
     if (team) {
         // It's a team task
         const currentMyStatus = (task.teamProgress?.[currentUser.id] || 'TODO') as TaskStatus;
         let nextStatus: TaskStatus = 'TODO';
         if (currentMyStatus === 'TODO') nextStatus = 'IN_PROGRESS';
         else if (currentMyStatus === 'IN_PROGRESS') nextStatus = 'DONE';
         else nextStatus = 'TODO'; // Cycle back

         const updatedTask: Task = {
             ...task,
             teamProgress: {
                 ...(task.teamProgress || {}),
                 [currentUser.id]: nextStatus
             }
         };
         onEditTask(updatedTask);
     } else {
         onEditTask(task);
     }
  };

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
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const assignedTeam = !assignee ? teams.find(t => t.id === task.assigneeId) : null;
                    
                    // Calculate progress for team task
                    let progressPercent = 0;
                    if (assignedTeam) {
                        const teamMembers = users.filter(u => u.teamId === assignedTeam.id);
                        const doneCount = teamMembers.filter(u => task.teamProgress?.[u.id] === 'DONE').length;
                        progressPercent = teamMembers.length > 0 ? Math.round((doneCount / teamMembers.length) * 100) : 0;
                    }

                    return (
                      <div 
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4 w-full">
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-sm font-bold text-slate-700">{task.startTime || '--:--'}</span>
                            <span className="text-xs text-slate-400">às {task.endTime || '--:--'}</span>
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                              {task.title}
                              {assignedTeam && (
                                <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                    <Users size={10} /> TIME
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {assignee && (
                                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                  <img src={assignee.avatar} className="w-4 h-4 rounded-full" alt="" />
                                  <span className="text-xs text-slate-600">{assignee.name.split(' ')[0]}</span>
                                </div>
                              )}
                              {assignedTeam && (
                                <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                   <Users size={12} className="text-indigo-600" />
                                   <span className="text-xs font-bold text-indigo-700">Toda a Equipe</span>
                                </div>
                              )}

                              {!assignedTeam ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[task.status]}`}>
                                    {STATUS_LABELS[task.status]}
                                </span>
                              ) : (
                                 <div className="flex items-center gap-2">
                                     <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="bg-indigo-600 h-full" style={{ width: `${progressPercent}%` }}></div>
                                     </div>
                                     <span className="text-[10px] font-bold text-slate-500">{progressPercent}%</span>
                                 </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Action Button Hint */}
                        <div 
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 text-slate-400"
                          onClick={(e) => handleQuickStatusUpdate(e, task)}
                        >
                           <PlayCircle size={20} className="hover:text-indigo-600" />
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
