import React from 'react';
import { Task, User, TaskStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { isSameDay, format } from 'date-fns';
import { PieChart, List, UserCheck, Home } from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  currentDate?: Date; // Default to today
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, users, currentDate = new Date() }) => {
  const todayTasks = tasks.filter(t => isSameDay(new Date(t.date), currentDate));
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');

  const stats = {
    TODO: todayTasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: todayTasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: todayTasks.filter(t => t.status === 'DONE'),
  };

  const total = todayTasks.length;
  
  // Determine Presence
  const presencialUsers = users.filter(u => u.presencialDates.includes(currentDateStr));
  const homeOfficeUsers = users.filter(u => !u.presencialDates.includes(currentDateStr));

  return (
    <div className="bg-slate-50 h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <PieChart className="text-indigo-600" /> Painel de Indicadores
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="text-sm text-slate-500 mb-1">Total Demandas</div>
           <div className="text-3xl font-bold text-slate-800">{total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-slate-400 border-slate-200">
           <div className="text-sm text-slate-500 mb-1">Não Iniciado</div>
           <div className="text-3xl font-bold text-slate-600">{stats.TODO.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-amber-400 border-slate-200">
           <div className="text-sm text-slate-500 mb-1">Em Andamento</div>
           <div className="text-3xl font-bold text-amber-600">{stats.IN_PROGRESS.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-emerald-400 border-slate-200">
           <div className="text-sm text-slate-500 mb-1">Concluídas</div>
           <div className="text-3xl font-bold text-emerald-600">{stats.DONE.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Report */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
            <List size={18} /> Detalhamento de Atividades
          </div>
          <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar">
            {todayTasks.length === 0 ? (
               <div className="text-center text-slate-400 py-8">Sem atividades hoje.</div>
            ) : (
               <div className="space-y-4">
                 {(Object.keys(stats) as TaskStatus[]).map(status => {
                    const statusTasks = stats[status];
                    if (statusTasks.length === 0) return null;
                    return (
                       <div key={status} className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{STATUS_LABELS[status]}</h4>
                          {statusTasks.map(task => {
                             const assignee = users.find(u => u.id === task.assigneeId);
                             return (
                               <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                  <div>
                                    <div className="font-semibold text-sm text-slate-800">{task.title}</div>
                                    <div className="text-xs text-slate-500">
                                      {task.startTime} - {task.endTime}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <img src={assignee?.avatar} className="w-6 h-6 rounded-full" alt=""/>
                                     <span className="text-xs font-medium text-slate-700">{assignee?.name}</span>
                                  </div>
                               </div>
                             )
                          })}
                       </div>
                    )
                 })}
               </div>
            )}
          </div>
        </div>

        {/* Presence List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-fit">
           <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
            <UserCheck size={18} /> Local de Trabalho
          </div>
          <div className="p-4 space-y-4">
             {/* Presencial Section */}
             <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Presencial</h4>
                <div className="space-y-2">
                   {presencialUsers.length === 0 && <span className="text-xs text-slate-400 italic">Ninguém no escritório hoje.</span>}
                   {presencialUsers.map(user => (
                     <div key={user.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="relative">
                           <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-slate-800">{user.name}</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Home Office Section */}
             <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Home Office</h4>
                <div className="space-y-2">
                   {homeOfficeUsers.length === 0 && <span className="text-xs text-slate-400 italic">Ninguém em home office.</span>}
                   {homeOfficeUsers.map(user => (
                     <div key={user.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 opacity-80">
                        <div className="relative">
                           <img src={user.avatar} className="w-8 h-8 rounded-full grayscale" alt="" />
                           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                           <div className="text-sm font-medium text-slate-600">{user.name}</div>
                        </div>
                        <Home size={14} className="ml-auto text-slate-400" />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;