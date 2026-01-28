
import React, { useState } from 'react';
import { User, Team } from '../types';
import { ShieldCheck, User as UserIcon, Filter } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  teams: Team[];
  onLogin: (user: User) => void;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, teams, onLogin, isLoading }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');

  const filteredUsers = selectedTeamId === 'ALL' 
    ? users 
    : users.filter(user => user.teamId === selectedTeamId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
             <ShieldCheck size={32} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo ao GestãoPRO</h2>
        <p className="text-slate-500 mb-6 text-sm">Identifique-se para acessar o painel da equipe.</p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
             <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <span className="text-xs font-medium text-slate-400">Carregando equipe...</span>
          </div>
        ) : (
          <>
            {/* Team Filter */}
            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-slate-400" />
                </div>
                <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                    <option value="ALL">Todos os Setores</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left mb-2 pl-1">
                    {selectedTeamId === 'ALL' ? 'Todos os Colaboradores' : 'Colaboradores do Setor'}
                </p>
                
                {filteredUsers.length === 0 && (
                    <div className="text-sm text-slate-400 bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
                        Nenhum usuário encontrado neste setor.
                    </div>
                )}

                {filteredUsers.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all group text-left relative overflow-hidden"
                >
                    <div className="relative z-10 flex items-center gap-4 w-full">
                        <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="" />
                        <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        </div>
                        
                        {!user.password ? (
                            <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wide">
                                Primeiro Acesso
                            </div>
                        ) : (
                            <div className="text-slate-300 group-hover:text-indigo-400">
                                <UserIcon size={18} />
                            </div>
                        )}
                    </div>
                </button>
                ))}
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
          Acesso restrito e monitorado. 
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
