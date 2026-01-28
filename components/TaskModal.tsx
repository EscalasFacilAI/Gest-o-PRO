import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User as UserIcon, Flag, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Task, User, Team, TaskStatus, Priority, normalizeDate } from '../types';
import { STATUS_LABELS } from '../constants';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onRequestTransfer?: (taskId: string, newAssigneeId: string) => void; // Kept for interface compatibility but unused
  initialTask?: Task | null;
  selectedDate?: Date;
  currentUser: User;
  users: User[]; // Dynamic users list
  teams: Team[]; // Dynamic teams list
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  initialTask, 
  selectedDate, 
  currentUser,
  users,
  teams
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Reset or populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description);
        setAssigneeId(initialTask.assigneeId);
        setPriority(initialTask.priority);
        setStatus(initialTask.status);
        setDateStr(format(initialTask.date, 'yyyy-MM-dd'));
        setStartTime(initialTask.startTime || '');
        setEndTime(initialTask.endTime || '');
      } else {
        // New Task
        setTitle('');
        setDescription('');
        setAssigneeId(currentUser.id); // Default to current user
        setPriority('MEDIUM');
        setStatus('TODO');
        setDateStr(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
        setStartTime('08:00');
        setEndTime('09:00');
      }
    }
  }, [isOpen, initialTask, selectedDate, currentUser]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !dateStr) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    const newTask: Task = {
      id: initialTask?.id || crypto.randomUUID(),
      title,
      description,
      assigneeId,
      priority,
      status,
      date: normalizeDate(localDate),
      startTime,
      endTime
    };
    onSave(newTask);
    onClose();
  };

  const handleClaimTask = () => {
    // Simple window.confirm check
    const confirmed = window.confirm("Você tem certeza que deseja assumir a responsabilidade por esta demanda?");
    
    if (confirmed) {
       // We need to trigger save immediately with new assignee (Current User)
       const [year, month, day] = dateStr.split('-').map(Number);
       const localDate = new Date(year, month - 1, day);

       const updatedTask: Task = {
        id: initialTask?.id || crypto.randomUUID(),
        title,
        description,
        assigneeId: currentUser.id, // Force assignment to me
        priority,
        status,
        date: normalizeDate(localDate),
        startTime,
        endTime
      };
      
      onSave(updatedTask);
      onClose();
    }
  };

  const isLeader = currentUser.role === 'LEADER';
  const isCoordinator = currentUser.role === 'COORDINATOR';
  const isOwner = initialTask ? initialTask.assigneeId === currentUser.id : true; // True if creating new
  const isCreating = !initialTask;

  // Permissions Logic
  // Coordinators can edit anything. Leaders can edit anything in their team (or simplified to generally editable for now).
  const canEditDetails = isCoordinator || isLeader || isOwner || isCreating;
  const canEditStatus = isCoordinator || isLeader || isOwner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {initialTask ? 'Detalhes da Demanda' : 'Nova Demanda'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* View Only Warning for non-owners */}
          {!canEditDetails && (
             <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5" />
                <div>
                   Visualizando demanda de outro membro.
                </div>
             </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input
              type="text"
              disabled={!canEditDetails}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="Ex: Entregar relatório de vendas"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <CalendarIcon size={14} /> Data
              </label>
              <input
                type="date"
                disabled={!canEditDetails}
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> Início
              </label>
              <input
                type="time"
                disabled={!canEditDetails}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> Fim
              </label>
              <input
                type="time"
                disabled={!canEditDetails}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Assignee (Grouped by Team) */}
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <UserIcon size={14} /> Responsável / Setor
              </label>
              <div className="relative">
                <select
                  disabled={!canEditDetails} 
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {teams.map(team => {
                    const teamMembers = users.filter(u => u.teamId === team.id);
                    if (teamMembers.length === 0) return null;
                    return (
                      <optgroup key={team.id} label={team.name}>
                        {teamMembers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  {/* Handle users without a team assigned just in case */}
                  <optgroup label="Sem Setor">
                    {users.filter(u => !u.teamId).map(user => (
                       <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </optgroup>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                  <UserIcon size={16} />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Flag size={14} /> Prioridade
              </label>
              <select
                disabled={!canEditDetails}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          {/* Status - Available if owner or leader */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <CheckCircle2 size={14} /> Status
            </label>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!canEditStatus}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                    status === s
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  } ${!canEditStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              disabled={!canEditDetails}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 resize-none"
              placeholder="Detalhes adicionais..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between">
           {/* Left Action: Delete or Claim */}
           {initialTask && (isLeader || isCoordinator) ? (
              <button
                onClick={() => {
                  if (onDelete && initialTask) onDelete(initialTask.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Excluir
              </button>
           ) : !isOwner && initialTask ? (
             <button
               onClick={handleClaimTask}
               className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
             >
               Assumir Demanda
             </button>
           ) : <div></div>}
           
           <div className="flex gap-3">
             <button
               onClick={onClose}
               className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
             >
               Cancelar
             </button>
             {canEditDetails && (
               <button
                 onClick={handleSave}
                 className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-all hover:scale-105"
               >
                 Salvar
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;