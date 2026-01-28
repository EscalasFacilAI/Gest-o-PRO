import React, { useState } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  format, isToday, isWithinInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import { Task, User, normalizeDate, AlertPeriod, ALERT_COLOR_MAP } from '../types';
import { STATUS_COLORS } from '../constants';

interface CalendarProps {
  tasks: Task[];
  users: User[];
  alertPeriods: AlertPeriod[];
  currentUser: User;
  onAddTask: (date: Date) => void;
  onEditTask: (task: Task) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, users, alertPeriods, currentUser, onAddTask, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
      .filter(task => isSameDay(normalizeDate(task.date), normalizeDate(date)))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const getAlertForDay = (date: Date) => {
    return alertPeriods.find(period => 
      isWithinInterval(normalizeDate(date), { 
        start: normalizeDate(period.startDate), 
        end: normalizeDate(period.endDate) 
      })
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
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
        
        <button 
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors"
        >
          Hoje
        </button>
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
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const alert = getAlertForDay(day);
            const alertStyles = alert ? ALERT_COLOR_MAP[alert.color] : null;
            
            return (
              <div 
                key={day.toISOString()} 
                className={`
                  relative flex flex-col p-2 group transition-colors min-h-[140px]
                  ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}
                  ${alertStyles ? alertStyles.bg + ' bg-opacity-30' : ''}
                `}
              >
                {/* Alert Background Label */}
                {alertStyles && (
                   <div className={`absolute top-0 left-0 w-full h-1 ${alertStyles.bg.replace('50', '400')}`}></div>
                )}

                {/* Day Number */}
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full z-10
                    ${isDayToday 
                      ? 'bg-indigo-600 text-white' 
                      : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                  `}>
                    {format(day, 'd')}
                  </span>

                   {/* Alert Icon */}
                   {alert && alertStyles && (
                     <div className="flex items-center gap-1 overflow-hidden">
                       <span className={`text-[10px] font-bold uppercase tracking-tighter truncate ${alertStyles.text}`}>
                         {alert.label}
                       </span>
                       <AlertTriangle size={12} className={alertStyles.icon} />
                     </div>
                   )}

                  {/* Add Button */}
                  <button 
                    onClick={() => onAddTask(day)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                    title="Nova Demanda"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Tasks List */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px] custom-scrollbar z-0">
                  {dayTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    
                    return (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className={`
                          text-left text-[10px] p-1.5 rounded-md border shadow-sm transition-transform hover:scale-[1.02]
                          ${STATUS_COLORS[task.status]}
                        `}
                      >
                        <div className="flex justify-between items-center mb-0.5 opacity-75">
                           <span>{task.startTime || '??:??'}</span>
                        </div>
                        <div className="font-semibold truncate leading-tight mb-0.5">{task.title}</div>
                        <div className="flex items-center justify-between opacity-80">
                          {assignee && (
                            <div className="flex items-center gap-1">
                               <img src={assignee.avatar} alt="" className="w-3 h-3 rounded-full" />
                               <span className="truncate max-w-[40px]">{assignee.name.split(' ')[0]}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
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