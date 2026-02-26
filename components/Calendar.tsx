
import React, { useState } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  format, isToday, isWithinInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Users, X, Clock, Eye, EyeOff, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Task, User, normalizeDate, AlertPeriod, ALERT_COLOR_MAP, Team } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface CalendarProps {
  tasks: Task[];
  users: User[];
  teams: Team[];
  alertPeriods: AlertPeriod[];
  currentUser: User;
  onAddTask: (date: Date) => void;
  onEditTask: (task: Task) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, users, teams, alertPeriods, currentUser, onAddTask, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  
  // 6. Option to hide completed demands
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Toggle between Tasks and Presence
  const [viewType, setViewType] = useState<'TASKS' | 'PRESENCE'>('TASKS');

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth); 
  const endDate = endOfWeek(lastDayOfMonth);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (date: Date) => {
    return tasks
      .filter(task => {
         const sameDay = isSameDay(normalizeDate(task.date), normalizeDate(date));
         // Filter out done tasks if toggle is off
         if (!showCompleted && task.status === 'DONE') return false;
         return sameDay;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const getPresentUsersForDay = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return users.filter(u => u.presencialDates.includes(dateStr));
  };

  // Allow multiple alerts per day
  const getAlertsForDay = (date: Date) => {
    return alertPeriods.filter(period => 
      isWithinInterval(normalizeDate(date), { 
        start: normalizeDate(period.startDate), 
        end: normalizeDate(period.endDate) 
      })
    );
  };

  const DayExpandedModal = () => {
    if (!expandedDay) return null;
    const dayTasks = getTasksForDay(expandedDay);
    const dayAlerts = getAlertsForDay(expandedDay);
    const presentUsers = getPresentUsersForDay(expandedDay);
    
    return (
      <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col p-6 animate-in fade-in zoom-in duration-200">
         <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
             <div>
                <h2 className="text-3xl font-bold text-slate-800 capitalize">
                    {format(expandedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                {isToday(expandedDay) && <span className="text-sm font-bold text-indigo-600 uppercase">Hoje</span>}
             </div>
             <div className="flex gap-3">
                 <button 
                   onClick={() => onAddTask(expandedDay)}
                   className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
                 >
                    <Plus size={18} /> Nova Demanda
                 </button>
                 <button 
                   onClick={() => setExpandedDay(null)}
                   className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
                 >
                    <X size={24} />
                 </button>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar">
             {/* Alerts Section in Expanded View */}
             {dayAlerts.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                   {dayAlerts.map(alert => (
                      <div key={alert.id} className={`${ALERT_COLOR_MAP[alert.color].bg} ${ALERT_COLOR_MAP[alert.color].text} border ${ALERT_COLOR_MAP[alert.color].border} px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2`}>
                         <AlertTriangle size={16} /> {alert.label}
                      </div>
                   ))}
                </div>
             )}

             {viewType === 'TASKS' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {dayTasks.length === 0 && (
                        <div className="col-span-full text-center text-slate-400 py-12 text-lg">
                           Nenhuma demanda agendada para este dia.
                        </div>
                     )}
                     {dayTasks.map(task => {
                        const assignee = users.find(u => u.id === task.assigneeId);
                        const assignedTeam = !assignee ? teams.find(t => t.id === task.assigneeId) : null;
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
                             className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                           >
                               <div className="flex justify-between items-start mb-2">
                                   <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                       <Clock size={14} />
                                       {task.startTime || '--:--'} - {task.endTime || '--:--'}
                                   </div>
                                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[task.status]}`}>
                                       {STATUS_LABELS[task.status]}
                                   </span>
                               </div>
                               
                               <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">
                                 {task.title}
                               </h3>
                               
                               {assignedTeam ? (
                                  <div className="mt-3">
                                     <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Equipe: {assignedTeam.name}</span>
                                        <span>{progressPercent}%</span>
                                     </div>
                                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                         <div className="bg-indigo-500 h-full" style={{ width: `${progressPercent}%` }}></div>
                                     </div>
                                  </div>
                               ) : assignee && (
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                                     <img src={assignee.avatar} className="w-6 h-6 rounded-full" alt=""/>
                                     <span className="text-sm text-slate-600">{assignee.name}</span>
                                  </div>
                               )}
                           </div>
                        )
                     })}
                 </div>
             ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {presentUsers.length === 0 && (
                        <div className="col-span-full text-center text-slate-400 py-12 text-lg">
                           Ninguém presencial neste dia.
                        </div>
                     )}
                     {presentUsers.map(u => (
                         <div key={u.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                             <img src={u.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt=""/>
                             <div>
                                 <div className="font-bold text-slate-800">{u.name}</div>
                                 <div className="text-xs text-green-700 font-medium">Presencial</div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Expanded Modal Overlay */}
      <DayExpandedModal />

      {/* Calendar Header */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewType('TASKS')}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewType === 'TASKS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Ver Demandas"
                >
                    <CalendarIcon size={18} />
                    <span className="hidden sm:inline">Demandas</span>
                </button>
                <button 
                    onClick={() => setViewType('PRESENCE')}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewType === 'PRESENCE' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Ver Escala Presencial"
                >
                    <MapPin size={18} />
                    <span className="hidden sm:inline">Presencial</span>
                </button>
            </div>

            <button
               onClick={() => setShowCompleted(!showCompleted)}
               className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${showCompleted ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-slate-500 bg-white border-slate-200'}`}
               title={showCompleted ? "Ocultar Concluídas" : "Mostrar Concluídas"}
            >
               {showCompleted ? <Eye size={18} /> : <EyeOff size={18} />}
               <span className="hidden sm:inline">{showCompleted ? 'Ocultar' : 'Mostrar'}</span>
            </button>

            <button 
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors"
            >
                Hoje
            </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="flex-none grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-7 min-h-full auto-rows-[minmax(120px,1fr)] bg-slate-100 gap-[1px]">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const presentUsers = getPresentUsersForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const dayAlerts = getAlertsForDay(day);
            
            return (
              <div 
                key={day.toISOString()} 
                onClick={() => setExpandedDay(day)}
                className={`
                  relative flex flex-col p-1 transition-colors min-h-[140px] cursor-pointer hover:bg-slate-50
                  ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}
                `}
              >
                {/* Header Row: Day Number + Alerts next to it */}
                <div className="flex justify-between items-start px-1 pt-1 mb-1 gap-1">
                  
                  {/* Day Number */}
                  <span className={`
                    text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0
                    ${isDayToday 
                      ? 'bg-indigo-600 text-white' 
                      : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                  `}>
                    {format(day, 'd')}
                  </span>

                  {/* Alerts Container (Next to Number) */}
                  <div className="flex flex-col gap-0.5 items-end flex-1 min-w-0 max-w-[80%]">
                      {dayAlerts.map(alert => (
                          <div 
                              key={alert.id} 
                              className={`
                                  w-full text-right ${ALERT_COLOR_MAP[alert.color].bg} ${ALERT_COLOR_MAP[alert.color].text} 
                                  border ${ALERT_COLOR_MAP[alert.color].border}
                                  text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate
                              `}
                              title={alert.label}
                          >
                              {alert.label}
                          </div>
                      ))}
                  </div>
                </div>

                {/* Content List */}
                <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                  {viewType === 'TASKS' ? (
                      <>
                        {dayTasks.slice(0, 4).map(task => {
                            const assignee = users.find(u => u.id === task.assigneeId);
                            const assignedTeam = !assignee ? teams.find(t => t.id === task.assigneeId) : null;
                            
                            return (
                            <div
                                key={task.id}
                                className={`
                                text-left text-[9px] px-1 py-0.5 rounded border truncate relative
                                ${!assignedTeam ? STATUS_COLORS[task.status] : 'bg-white border-slate-200 text-slate-700'}
                                `}
                            >
                                <span className="font-semibold">{task.startTime}</span> {task.title}
                            </div>
                            );
                        })}
                        {dayTasks.length > 4 && (
                            <div className="text-[9px] text-slate-400 text-center font-medium">+ {dayTasks.length - 4} mais</div>
                        )}
                      </>
                  ) : (
                      <>
                        {presentUsers.slice(0, 5).map(u => (
                            <div key={u.id} className="flex items-center gap-1 bg-green-50 border border-green-100 rounded px-1 py-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-[9px] font-medium text-green-800 truncate">{u.name.split(' ')[0]}</span>
                            </div>
                        ))}
                        {presentUsers.length > 5 && (
                            <div className="text-[9px] text-slate-400 text-center font-medium">+ {presentUsers.length - 5} presencial</div>
                        )}
                      </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
