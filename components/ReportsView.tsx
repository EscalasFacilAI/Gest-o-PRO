
import React, { useState } from 'react';
import { Task, User } from '../types';
import { STATUS_LABELS } from '../constants';
import { format, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileBarChart, PieChart, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ReportsViewProps {
  tasks: Task[];
  users: User[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ tasks, users }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Filter tasks for the selected month
  const monthlyTasks = tasks.filter(t => isSameMonth(t.date, currentMonth));

  // 1. Overall Stats
  const totalTasks = monthlyTasks.length;
  const doneTasks = monthlyTasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = monthlyTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoTasks = monthlyTasks.filter(t => t.status === 'TODO').length;
  
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // 2. Performance by User
  const userStats = users.map(user => {
    const userTasks = monthlyTasks.filter(t => t.assigneeId === user.id);
    const uDone = userTasks.filter(t => t.status === 'DONE').length;
    const uPending = userTasks.filter(t => t.status !== 'DONE').length;
    
    return {
       user,
       total: userTasks.length,
       done: uDone,
       pending: uPending,
       rate: userTasks.length > 0 ? Math.round((uDone / userTasks.length) * 100) : 0
    };
  }).filter(stat => stat.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
       
       {/* Header with Month Selector */}
       <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <FileBarChart className="text-indigo-600" /> Relatório Mensal
          </h2>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
               <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center capitalize">
               {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
               <ChevronRight size={20} />
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="text-xs font-bold text-indigo-500 uppercase mb-1">Total de Atividades</div>
                <div className="text-3xl font-bold text-indigo-700">{totalTasks}</div>
                <div className="text-xs text-indigo-400 mt-1">Neste mês</div>
             </div>
             
             <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="text-xs font-bold text-emerald-500 uppercase mb-1">Taxa de Conclusão</div>
                <div className="text-3xl font-bold text-emerald-700">{completionRate}%</div>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                   <div className="bg-emerald-500 h-full" style={{ width: `${completionRate}%` }}></div>
                </div>
             </div>

             <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="text-xs font-bold text-amber-500 uppercase mb-1">Em Andamento</div>
                <div className="text-3xl font-bold text-amber-700">{inProgressTasks}</div>
             </div>

             <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Pendentes (Não Iniciado)</div>
                <div className="text-3xl font-bold text-slate-700">{todoTasks}</div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* Status Distribution */}
             <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <PieChart size={18} /> Distribuição por Status
                </h3>
                <div className="space-y-3">
                   <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                         <span>Concluído</span>
                         <span>{doneTasks} ({totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                         <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalTasks > 0 ? (doneTasks/totalTasks)*100 : 0}%` }}></div>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                         <span>Em Andamento</span>
                         <span>{inProgressTasks} ({totalTasks > 0 ? Math.round((inProgressTasks/totalTasks)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                         <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalTasks > 0 ? (inProgressTasks/totalTasks)*100 : 0}%` }}></div>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                         <span>Não Iniciado</span>
                         <span>{todoTasks} ({totalTasks > 0 ? Math.round((todoTasks/totalTasks)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                         <div className="bg-slate-400 h-full rounded-full" style={{ width: `${totalTasks > 0 ? (todoTasks/totalTasks)*100 : 0}%` }}></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Performance List */}
             <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <CheckCircle2 size={18} /> Desempenho da Equipe
                </h3>
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                   {userStats.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400">Nenhum dado para este mês.</div>
                   ) : (
                      <div className="divide-y divide-slate-100">
                         {userStats.map((stat, idx) => (
                            <div key={stat.user.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                               <div className="flex items-center gap-3">
                                  <div className="text-xs font-bold text-slate-400 w-4">{idx + 1}</div>
                                  <img src={stat.user.avatar} className="w-8 h-8 rounded-full" alt=""/>
                                  <div>
                                     <div className="text-sm font-semibold text-slate-800">{stat.user.name}</div>
                                     <div className="text-xs text-slate-500">{stat.total} demandas</div>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4 text-right">
                                  <div>
                                     <div className="text-xs font-bold text-emerald-600">{stat.done} ok</div>
                                     <div className="text-[10px] text-slate-400">Concluídas</div>
                                  </div>
                                  <div>
                                     <div className="text-xs font-bold text-slate-600">{stat.pending} pend</div>
                                     <div className="text-[10px] text-slate-400">Restantes</div>
                                  </div>
                                  <div className="w-12 text-center">
                                      <div className={`text-sm font-bold ${stat.rate >= 80 ? 'text-emerald-600' : stat.rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                         {stat.rate}%
                                      </div>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

          </div>

          {/* Detailed Task List (Optional/Collapsible could be here) */}
          <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase">Atividades Recentes no Mês</h3>
              <div className="space-y-2">
                 {monthlyTasks.slice(0, 10).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-xs">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                           <span className="font-medium text-slate-700">{task.title}</span>
                           <span className="text-slate-400 text-[10px]">({format(task.date, 'dd/MM')})</span>
                        </div>
                        <span className="text-slate-500 truncate max-w-[100px]">{users.find(u => u.id === task.assigneeId)?.name}</span>
                    </div>
                 ))}
                 {monthlyTasks.length > 10 && (
                    <div className="text-center text-xs text-slate-400 italic pt-1">E mais {monthlyTasks.length - 10} atividades...</div>
                 )}
              </div>
          </div>

       </div>
    </div>
  );
};

export default ReportsView;
