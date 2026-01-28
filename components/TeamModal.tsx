
import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, Users, Briefcase, Pencil, UserCheck, Info } from 'lucide-react';
import { User, Role, Team } from '../types';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  teams: Team[];
  onAddUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onAddTeam: (team: Team) => void;
  onRemoveTeam: (teamId: string) => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  teams,
  onAddUser,
  onEditUser,
  onRemoveUser,
  onAddTeam,
  onRemoveTeam 
}) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'TEAMS'>('MEMBERS');
  
  // User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [teamId, setTeamId] = useState<string>(teams[0]?.id || '');

  // Team Form
  const [newTeamName, setNewTeamName] = useState('');

  if (!isOpen) return null;

  // Load user data into form for editing
  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setTeamId(user.teamId);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setRole('MEMBER');
  };

  const handleSaveUser = () => {
    if (!name || !email || !teamId) return;

    if (editingUserId) {
      // Editing existing user
      const originalUser = users.find(u => u.id === editingUserId);
      if (originalUser) {
        const updatedUser: User = {
          ...originalUser,
          name,
          email,
          role,
          teamId,
          // Update avatar if name changed essentially
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        };
        onEditUser(updatedUser);
      }
      handleCancelEdit();
    } else {
      // Creating new user
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        teamId,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        presencialDates: []
      };
      onAddUser(newUser);
      // Reset form
      setName('');
      setEmail('');
      setRole('MEMBER');
    }
  };

  const handleAddTeam = () => {
    if (!newTeamName) return;
    const newTeam: Team = {
      id: 'team_' + crypto.randomUUID().slice(0, 8),
      name: newTeamName,
      color: 'slate'
    };
    onAddTeam(newTeam);
    setNewTeamName('');
    if (teams.length === 0) setTeamId(newTeam.id);
  };

  const getRoleLabel = (r: Role) => {
    if (r === 'COORDINATOR') return 'Coordenador';
    if (r === 'LEADER') return 'Líder';
    return 'Membro';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-indigo-600"/> Gerenciar Equipe
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          <button 
            onClick={() => setActiveTab('MEMBERS')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'MEMBERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Membros
          </button>
          <button 
            onClick={() => setActiveTab('TEAMS')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'TEAMS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Setores / Equipes
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'MEMBERS' && (
            <>
              {/* User Form */}
              <div className={`mb-6 p-4 rounded-lg border space-y-3 transition-colors ${editingUserId ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                 <h3 className={`text-sm font-bold flex items-center gap-2 ${editingUserId ? 'text-indigo-700' : 'text-slate-700'}`}>
                   {editingUserId ? <Pencil size={16} /> : <UserPlus size={16} />} 
                   {editingUserId ? 'Editar Colaborador' : 'Adicionar Colaborador'}
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <input 
                     type="text" 
                     value={name}
                     onChange={e => setName(e.target.value)}
                     placeholder="Nome completo"
                     className="col-span-2 w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                   />
                   <input 
                     type="email" 
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     placeholder="E-mail profissional"
                     className="col-span-2 w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white"
                   />
                   
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Cargo</label>
                      <select 
                        value={role}
                        onChange={e => setRole(e.target.value as Role)}
                        className="w-full px-2 py-2 border border-slate-300 rounded text-sm bg-white"
                      >
                         <option value="MEMBER">Membro</option>
                         <option value="LEADER">Líder</option>
                         <option value="COORDINATOR">Coordenador</option>
                      </select>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        {role === 'COORDINATOR' ? 'Lotação / Equipe Principal' : 'Setor'}
                      </label>
                      <select 
                        value={teamId}
                        onChange={e => setTeamId(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded text-sm bg-white"
                      >
                         <option value="" disabled>Selecione...</option>
                         {teams.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                         ))}
                      </select>
                   </div>
                 </div>

                 {role === 'COORDINATOR' && (
                    <div className="bg-indigo-100 text-indigo-800 p-2 rounded text-xs flex items-start gap-2 border border-indigo-200">
                       <Info size={14} className="mt-0.5 shrink-0" />
                       <div>
                         <strong>Acesso Global:</strong> Coordenadores visualizam automaticamente demandas de <u>todas as equipes</u>, independente da lotação selecionada acima.
                       </div>
                    </div>
                 )}

                 <div className="flex gap-2">
                   {editingUserId && (
                     <button 
                       onClick={handleCancelEdit}
                       className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm font-medium py-2 rounded hover:bg-slate-50"
                     >
                       Cancelar
                     </button>
                   )}
                   <button 
                     onClick={handleSaveUser}
                     disabled={!teamId}
                     className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {editingUserId ? 'Salvar Alterações' : 'Cadastrar'}
                   </button>
                 </div>
              </div>

              {/* List Users */}
              <div className="space-y-2">
                {users.map(user => {
                  const userTeam = teams.find(t => t.id === user.teamId);
                  const isEditing = user.id === editingUserId;
                  return (
                    <div key={user.id} className={`flex items-center justify-between p-2 border rounded hover:bg-slate-50 ${isEditing ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100'}`}>
                       <div className="flex items-center gap-3 overflow-hidden">
                          <img src={user.avatar} className="w-9 h-9 rounded-full shrink-0" alt=""/>
                          <div className="min-w-0">
                             <div className="text-sm font-medium text-slate-800 truncate">{user.name}</div>
                             <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                   user.role === 'COORDINATOR' ? 'bg-purple-100 text-purple-700' :
                                   user.role === 'LEADER' ? 'bg-indigo-100 text-indigo-700' :
                                   'bg-slate-200 text-slate-600'
                                }`}>
                                   {getRoleLabel(user.role)}
                                </span>
                                {userTeam && (
                                   <span className="truncate text-slate-400">• {userTeam.name}</span>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center">
                         <button 
                           onClick={() => handleStartEdit(user)}
                           className="text-slate-400 hover:text-indigo-600 p-2"
                           title="Editar"
                         >
                           <Pencil size={16} />
                         </button>
                         <button 
                           onClick={() => onRemoveUser(user.id)}
                           className="text-slate-400 hover:text-red-500 p-2"
                           title="Remover"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'TEAMS' && (
            <>
               <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Briefcase size={16} /> Criar Novo Setor
                  </h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="Nome do Setor (ex: Almoxarifado)"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                    <button 
                      onClick={handleAddTeam}
                      className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-black"
                    >
                      Criar
                    </button>
                  </div>
               </div>

               <div className="space-y-2">
                 {teams.map(team => {
                   const memberCount = users.filter(u => u.teamId === team.id).length;
                   return (
                     <div key={team.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                        <div>
                           <div className="text-sm font-bold text-slate-800">{team.name}</div>
                           <div className="text-xs text-slate-500">{memberCount} membros</div>
                        </div>
                        {memberCount === 0 && (
                          <button 
                             onClick={() => onRemoveTeam(team.id)}
                             className="text-red-300 hover:text-red-500 p-2"
                           >
                             <Trash2 size={16} />
                           </button>
                        )}
                     </div>
                   );
                 })}
               </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeamModal;
