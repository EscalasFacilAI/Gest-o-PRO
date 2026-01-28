
import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User as UserIcon, Flag, CheckCircle2, Clock, AlertCircle, Megaphone } from 'lucide-react';
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
  const [targetTeamId, setTargetTeamId] = useState<string>(''); // For filtering task per team
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isNudged, setIsNudged] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNudge, setPendingNudge] = useState(false);

  // Reset or populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUnsavedChanges(false);
      setPendingNudge(false);
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description);
        setAssigneeId(initialTask.assigneeId);
        setPriority(initialTask.priority);
        setStatus(initialTask.status);
        setDateStr(format(initialTask.date, 'yyyy-MM-dd'));
        setStartTime(initialTask.startTime || '');
        setEndTime(initialTask.endTime || '');
        setTargetTeamId(initialTask.targetTeamId || '');
        setIsNudged(initialTask.isNudged || false);

        // Auto-set team based on assignee if missing
        if (!initialTask.targetTeamId) {
            const assignee = users.find(u => u.id === initialTask.assigneeId);
            if (assignee) setTargetTeamId(assignee.teamId);
        }

      } else {
        // New Task
        setTitle('');
        setDescription('');
        setAssigneeId(currentUser.id); // Default to current user
        setTargetTeamId(currentUser.teamId || teams[0]?.id || '');
        setPriority('MEDIUM');
        setStatus('TODO');
        setDateStr(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
        setStartTime('08:00');
        setEndTime('09:00');
        setIsNudged(false);
      }
    }
  }, [isOpen, initialTask, selectedDate, currentUser, users, teams]);

  // Track changes to show save button prompt
  useEffect(() => {
     if(isOpen) setHasUnsavedChanges(true);
  }, [title, description, assigneeId, targetTeamId, priority, status, dateStr, startTime, endTime, isNudged]);


  if (!isOpen) return null;

  const buildTaskObject = (overrides: Partial<Task> = {}): Task | null => {
    if (!title.trim() || !dateStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    return {
      id: initialTask?.id || crypto.randomUUID(),
      title,
      description,
      assigneeId,
      targetTeamId,
      priority,
      status,
      date: normalizeDate(localDate),
      startTime,
      endTime,
      isNudged,
      ...overrides
    };
  };

  const handleSave = () => {
    const task = buildTaskObject();
    if (task) {
      onSave(task);
      onClose();
    }
  };

  const handleNudge = () => {
       // Just update local state immediately to show visual feedback
       if (!description.includes('[COBRANÇA]')) {
         setDescription(`[COBRANÇA]: Solicitada prioridade em ${format(new Date(), 'dd/MM HH:mm')}.\n` + description);
       }
       setPriority('HIGH');
       setIsNudged(true);
       setPendingNudge(true); // Triggers visual warning to save
  };

  const handleClaimTask = () => {
    const confirmed = window.confirm("Você tem certeza que deseja assumir a responsabilidade por esta demanda?\n\nO responsável será alterado para você. Clique em 'Salvar' para confirmar.");
    if (confirmed) {
       // Just update local state
       setAssigneeId(currentUser.id);
       setTargetTeamId(currentUser.teamId); // Update team to my team as well
    }
  };

  const isLeader = currentUser.role === 'LEADER';
  const isCoordinator = currentUser.role === 'COORDINATOR';
  const isOwner = initialTask ? initialTask.assigneeId === currentUser.id : true; // True if creating new
  const isCreating = !initialTask;

  // Permissions Logic
  const canEditDetails = isCoordinator || isLeader || isOwner || isCreating;
  const canEditStatus = isCoordinator || isLeader || isOwner;
  const canNudge = (isLeader || isCoordinator) && !isOwner && initialTask;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {initialTask ? 'Detalhes da Demanda' : 'Nova Demanda'}
            {isNudged && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full border border-red-200 animate-pulse">URGENTE / COBRADO</span>}
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
          
          {/* Nudge Warning */}
          {pendingNudge && (
             <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex items-start gap-2 animate-in slide-in-from-top-2">
                <Megaphone size={16} className="mt-0.5" />
                <div>
                   <strong>Cobrança registrada!</strong> A prioridade foi alterada para ALTA e uma nota foi adicionada à descrição. <br/>
                   Clique em <strong>Salvar</strong> para confirmar.
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
                <UserIcon size={14} /> Responsável
              </label>
              <div className="relative">
                <select
                  disabled={!canEditDetails} 
                  value={assigneeId}
                  onChange={(e) => {
                     setAssigneeId(e.target.value);
                     // Auto-update team ID based on user
                     const u = users.find(u => u.id === e.target.value);
                     if(u) setTargetTeamId(u.teamId);
                  }}
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

            {/* Target Team Selection (Explicit) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Flag size={14} /> Equipe da Demanda
              </label>
              <select
                disabled={!canEditDetails}
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              >
                 <option value="" disabled>Selecione...</option>
                 {teams.map(t => (
                   <option key={t.id} value={t.id}>{t.name}</option>
                 ))}
              </select>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
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
            
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                 <CheckCircle2 size={14} /> Status
               </label>
               <select
                 disabled={!canEditStatus}
                 value={status}
                 onChange={(e) => setStatus(e.target.value as TaskStatus)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
               >
                 {Object.keys(STATUS_LABELS).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s as TaskStatus]}</option>
                 ))}
               </select>
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 resize-none text-sm"
              placeholder="Detalhes adicionais..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center">
           {/* Left Action: Delete or Claim or Nudge */}
           <div className="flex gap-2">
             {initialTask && (isLeader || isCoordinator) && (
                <button
                  onClick={() => {
                    if (onDelete && initialTask) onDelete(initialTask.id);
                    onClose();
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Excluir
                </button>
             )}
             
             {canNudge && !isNudged && (
                <button
                  onClick={handleNudge}
                  disabled={pendingNudge}
                  className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                  title="Atualizará prioridade para Alta e adicionará flag de Cobrança. Requer salvar."
                >
                  <Megaphone size={14} /> {pendingNudge ? 'Cobrança Pendente' : 'Cobrar Entrega'}
                </button>
             )}
             
             {!isOwner && initialTask && (
               <button
                 onClick={handleClaimTask}
                 className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                 title="Tornar-se o responsável. Requer salvar."
               >
                 Assumir
               </button>
             )}
           </div>
           
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
