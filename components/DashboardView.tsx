
import React, { useState } from 'react';
import { Task, User, TaskStatus } from '../types';
import { STATUS_LABELS } from '../constants';
import { isSameDay, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, UserCheck, Home, ArrowRight, CalendarDays, FileDown, Activity, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import UserActivitiesModal from './UserActivitiesModal';

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  currentDate?: Date; // Default to today
  onFilterRequest?: (status: TaskStatus | 'ALL') => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, users, currentUser, currentDate = new Date(), onFilterRequest }) => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [reportMonth, setReportMonth] = useState(new Date());
  const [selectedUserForReport, setSelectedUserForReport] = useState<User | null>(null);

  // Filter users based on role
  const visibleUsers = users.filter(u => {
      if (currentUser.role === 'COORDINATOR') return true;
      return u.teamId === currentUser.teamId;
  });

  const [selectedPresenceDate, setSelectedPresenceDate] = useState(currentDate);

  // --- DAILY VIEW LOGIC ---
  const todayTasks = tasks.filter(t => isSameDay(new Date(t.date), currentDate));
  
  const dailyStats = {
    TODO: todayTasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: todayTasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: todayTasks.filter(t => t.status === 'DONE'),
  };

  const totalToday = todayTasks.length;
  
  // Presence Logic
  const handlePrevPresenceDate = () => setSelectedPresenceDate(prev => new Date(prev.setDate(prev.getDate() - 1)));
  const handleNextPresenceDate = () => setSelectedPresenceDate(prev => new Date(prev.setDate(prev.getDate() + 1)));
  
  const presenceDateStr = format(selectedPresenceDate, 'yyyy-MM-dd');
  const presencialUsers = visibleUsers.filter(u => u.presencialDates.includes(presenceDateStr));
  const homeOfficeUsers = visibleUsers.filter(u => !u.presencialDates.includes(presenceDateStr));

  // --- MONTHLY REPORT LOGIC ---
  const handlePrevMonth = () => setReportMonth(subMonths(reportMonth, 1));
  const handleNextMonth = () => setReportMonth(addMonths(reportMonth, 1));

  const monthlyTasks = tasks.filter(t => isSameMonth(t.date, reportMonth));
  const totalMonth = monthlyTasks.length;
  const doneMonth = monthlyTasks.filter(t => t.status === 'DONE').length;
  const inProgressMonth = monthlyTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoMonth = monthlyTasks.filter(t => t.status === 'TODO').length;
  const completionRate = totalMonth > 0 ? Math.round((doneMonth / totalMonth) * 100) : 0;

  const userStats = visibleUsers.map(user => {
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

  const handleCardClick = (status: TaskStatus | 'ALL') => {
    if (onFilterRequest) {
      onFilterRequest(status);
    }
  };

  const downloadCSV = () => {
    const headers = ['Titulo', 'Descricao', 'Responsavel', 'Data', 'Inicio', 'Fim', 'Status', 'Prioridade'];
    const rows = monthlyTasks.map(t => {
       const user = users.find(u => u.id === t.assigneeId);
       // Escape double quotes by replacing " with ""
       const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
       
       return [
          escape(t.title),
          escape(t.description),
          escape(user ? user.name : 'N/A'),
          format(new Date(t.date), 'dd/MM/yyyy'),
          t.startTime,
          t.endTime,
          STATUS_LABELS[t.status],
          t.priority || 'NORMAL'
       ].join(',');
    });

    // Add BOM for Excel compatibility
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Atividades_${format(reportMonth, 'MMM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50 h-full overflow-hidden flex flex-col">
      {/* Tabs Header */}
      <div className="bg-white border-b border-slate-200 px-6 pt-4 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-600" /> Painel de Indicadores
          </h2>
          <div className="flex gap-4 mb-4">
             <button 
               onClick={() => setActiveTab('DAILY')}
               className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DAILY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                Visão do Dia
             </button>
             <button 
               onClick={() => setActiveTab('MONTHLY')}
               className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'MONTHLY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                Relatório Mensal
             </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {activeTab === 'DAILY' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button onClick={() => handleCardClick('ALL')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:shadow-md transition-all hover:scale-[1.02] group">
                <div className="text-sm text-slate-500 mb-1 flex justify-between">
                    Total Hoje <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-slate-800">{totalToday}</div>
                </button>
                <button onClick={() => handleCardClick('TODO')} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-slate-400 border-slate-200 text-left hover:shadow-md transition-all hover:scale-[1.02] group">
                <div className="text-sm text-slate-500 mb-1 flex justify-between">
                    Não Iniciado <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-slate-600">{dailyStats.TODO.length}</div>
                </button>
                <button onClick={() => handleCardClick('IN_PROGRESS')} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-amber-400 border-slate-200 text-left hover:shadow-md transition-all hover:scale-[1.02] group">
                <div className="text-sm text-slate-500 mb-1 flex justify-between">
                    Em Andamento <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-amber-600">{dailyStats.IN_PROGRESS.length}</div>
                </button>
                <button onClick={() => handleCardClick('DONE')} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-emerald-400 border-slate-200 text-left hover:shadow-md transition-all hover:scale-[1.02] group">
                <div className="text-sm text-slate-500 mb-1 flex justify-between">
                    Concluídas <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-emerald-600">{dailyStats.DONE.length}</div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={18} /> Cronograma do Dia
                </div>
                <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar">
                    {todayTasks.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">Nenhuma atividade agendada para hoje.</div>
                    ) : (
                    <div className="space-y-4">
                        {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map(status => {
                            const statusTasks = todayTasks.filter(t => t.status === status);
                            if (statusTasks.length === 0) return null;
                            return (
                            <div key={status} className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{STATUS_LABELS[status]}</h4>
                                {statusTasks.map(task => {
                                    const assignee = users.find(u => u.id === task.assigneeId);
                                    return (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                            {task.title}
                                            {task.isNudged && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">COBRADO</span>}
                                            </div>
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
                <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <UserCheck size={18} /> Local de Trabalho
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                       <button onClick={() => setSelectedPresenceDate(prev => new Date(prev.setDate(prev.getDate() - 1)))} className="p-1 hover:bg-white rounded shadow-sm transition-all text-slate-500">
                          <ChevronLeft size={14} />
                       </button>
                       <span className="px-2 text-xs font-semibold text-slate-600 min-w-[80px] text-center">
                          {isSameDay(selectedPresenceDate, new Date()) ? 'Hoje' : format(selectedPresenceDate, 'dd/MM', { locale: ptBR })}
                       </span>
                       <button onClick={() => setSelectedPresenceDate(prev => new Date(prev.setDate(prev.getDate() + 1)))} className="p-1 hover:bg-white rounded shadow-sm transition-all text-slate-500">
                          <ChevronRight size={14} />
                       </button>
                    </div>
                </div>
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
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
                                <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                    {users.find(u => u.id === user.id)?.role === 'COORDINATOR' ? 'Coordenador' : 'Membro'}
                                </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
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
          </>
        ) : (
           /* MONTHLY REPORT VIEW */
           <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                    <ChevronLeft size={20} />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center capitalize">
                    {format(reportMonth, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                    <ChevronRight size={20} />
                    </button>
                 </div>

                 <button 
                   onClick={downloadCSV}
                   className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors"
                 >
                    <FileDown size={18} />
                    Exportar Excel (.csv)
                 </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="text-xs font-bold text-indigo-500 uppercase mb-1">Total de Atividades</div>
                    <div className="text-3xl font-bold text-indigo-700">{totalMonth}</div>
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
                    <div className="text-3xl font-bold text-amber-700">{inProgressMonth}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Pendentes</div>
                    <div className="text-3xl font-bold text-slate-700">{todoMonth}</div>
                </div>
              </div>

              {/* Performance List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                   <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Desempenho da Equipe ({format(reportMonth, 'MMM/yyyy', { locale: ptBR })})
                   </div>
                   {userStats.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400">Nenhum dado para este mês.</div>
                   ) : (
                      <div className="divide-y divide-slate-100">
                         {userStats.map((stat, idx) => (
                            <div 
                                key={stat.user.id} 
                                onClick={() => setSelectedUserForReport(stat.user)}
                                className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                               <div className="flex items-center gap-3">
                                  <div className="text-xs font-bold text-slate-400 w-4">{idx + 1}</div>
                                  <img src={stat.user.avatar} className="w-8 h-8 rounded-full" alt=""/>
                                  <div>
                                     <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{stat.user.name}</div>
                                     <div className="text-xs text-slate-500">{stat.total} demandas</div>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4 text-right">
                                  <div className="hidden sm:block">
                                     <div className="text-xs font-bold text-emerald-600">{stat.done} ok</div>
                                     <div className="text-[10px] text-slate-400">Concluídas</div>
                                  </div>
                                  <div className="hidden sm:block">
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
        )}

      </div>
      
      {/* User Activities Modal */}
      <UserActivitiesModal 
         isOpen={!!selectedUserForReport}
         onClose={() => setSelectedUserForReport(null)}
         user={selectedUserForReport}
         tasks={monthlyTasks.filter(t => selectedUserForReport && t.assigneeId === selectedUserForReport.id)}
         month={reportMonth}
      />
    </div>
  );
};

export default DashboardView;
