import React, { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import TaskModal from './components/TaskModal';
import TaskListView from './components/TaskListView';
import TeamModal from './components/TeamModal';
import AlertModal from './components/AlertModal';
import DashboardView from './components/DashboardView';
import PresencialModal from './components/PresencialModal';
import UserAuthModal from './components/UserAuthModal'; // Import Auth Modal

import { User, Task, AlertPeriod, normalizeDate, Team } from './types';
import { USERS, INITIAL_TASKS, INITIAL_TEAMS } from './constants';
import { api, setApiUrl, getApiUrl } from './services/api';
import { Layout, CheckSquare, List, Calendar as CalendarIcon, Settings, PieChart, MapPin, AlertTriangle, Users, User as UserIcon, Database, Link as LinkIcon, RefreshCw, Loader2, XCircle, X, Filter, KeyRound } from 'lucide-react';

const App: React.FC = () => {
  // Config State
  const [isConfigOpen, setIsConfigOpen] = useState(!getApiUrl());
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [configError, setConfigError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); 
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [alertPeriods, setAlertPeriods] = useState<AlertPeriod[]>([]);
  
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST' | 'DASHBOARD'>('CALENDAR');
  const [filterScope, setFilterScope] = useState<string>('MY_TEAM'); 
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isPresencialModalOpen, setIsPresencialModalOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTargetUser, setAuthTargetUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'CHANGE_PASSWORD'>('LOGIN');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // --- API & SYNC LOGIC ---

  const fetchData = async (): Promise<boolean> => {
    if (!getApiUrl()) return false;
    
    try {
      setIsSyncing(true);
      const data = await api.sync();
      
      const parsedTasks: Task[] = data.tasks.map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));

      const parsedAlerts: AlertPeriod[] = data.alerts.map((a: any) => ({
        ...a,
        startDate: new Date(a.startDate),
        endDate: new Date(a.endDate),
      }));

      const parsedUsers: User[] = data.users.map((u: any) => ({
        ...u,
        presencialDates: Array.isArray(u.presencialDates) ? u.presencialDates : [],
        // FIX: Ensure password is treated as a string even if Google Sheets sends a number
        password: (u.password !== undefined && u.password !== null && u.password !== '') ? String(u.password) : undefined
      }));
      
      const parsedTeams: Team[] = data.teams || [];

      setTasks(parsedTasks);
      
      // SMART MERGE USERS: Prevent overwriting local password with empty server password (due to latency)
      if (parsedUsers.length > 0) {
        setTeamUsers(prevUsers => {
            return parsedUsers.map(serverUser => {
                const localUser = prevUsers.find(u => u.id === serverUser.id);
                // If local has password but server doesn't yet (latency issue), KEEP LOCAL
                if (localUser?.password && !serverUser.password) {
                    return { ...serverUser, password: localUser.password };
                }
                return serverUser;
            });
        });
      } else {
        setTeamUsers(USERS);
      }

      if (parsedTeams.length > 0) setTeams(parsedTeams);
      else setTeams(INITIAL_TEAMS);

      setAlertPeriods(parsedAlerts);
      
      // Update current user reference but preserve local password if server lags
      setTeamUsers(currentList => {
         const foundCurrent = currentList.find(u => u.id === currentUser.id);
         if (foundCurrent) {
            // Check if vital data changed, but ignore transient UI states
            // We use this mostly to keep roles and names in sync
            if (foundCurrent.name !== currentUser.name || foundCurrent.role !== currentUser.role || foundCurrent.teamId !== currentUser.teamId) {
               setCurrentUser(prev => ({ ...prev, ...foundCurrent }));
            }
         } else if (currentList.length > 0 && !currentList.find(u => u.id === currentUser.id)) {
            setCurrentUser(currentList[0]);
         }
         return currentList; 
      });

      setConnectionStatus('CONNECTED');
      return true;
    } catch (error) {
      console.error("Sync Error", error);
      setConnectionStatus('ERROR');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (getApiUrl()) {
      fetchData();
      const intervalId = setInterval(fetchData, 5000);
      return () => clearInterval(intervalId);
    } else {
      setTasks(INITIAL_TASKS);
      setTeamUsers(USERS);
      setTeams(INITIAL_TEAMS);
    }
  }, []); 

  useEffect(() => {
    setFilterScope('MY_TEAM');
  }, [currentUser.id]);

  const handleConnect = async () => {
    setConfigError(null);
    setIsSyncing(true);
    setApiUrl(apiUrlInput);
    
    const success = await fetchData();
    
    if (success) {
      setIsConfigOpen(false);
    } else {
      setConfigError("Não foi possível conectar. Verifique se autorizou o script e se a permissão de acesso está definida como 'Qualquer pessoa'.");
      setConnectionStatus('ERROR');
    }
    setIsSyncing(false);
  };

  // --- AUTH HANDLERS ---

  const handleUserSwitchClick = (user: User) => {
    setAuthTargetUser(user);
    setAuthMode('LOGIN');
    setIsAuthModalOpen(true);
    setIsUserSwitcherOpen(false); // Close dropdown
  };

  const handleChangePasswordClick = () => {
    setAuthTargetUser(currentUser);
    setAuthMode('CHANGE_PASSWORD');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (updatedUser?: User) => {
    // 1. Update Local State IMMEDIATELY
    if (updatedUser) {
        setTeamUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        
        if (currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        } else {
            // If switching user, log them in
            setCurrentUser(updatedUser);
        }

        // 2. Send to Server asynchronously
        if (getApiUrl()) {
            await api.saveUser(updatedUser);
            // Do NOT call fetchData immediately to avoid race condition with latency
        }
    } else if (authTargetUser) {
        // Just a login with no data change
        setCurrentUser(authTargetUser);
    }
    
    if (authMode === 'CHANGE_PASSWORD') {
        alert("Senha alterada com sucesso!");
    }
  };

  // --- DATA HANDLERS ---

  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setSelectedDate(task.date);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskToSave: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === taskToSave.id);
      if (exists) return prev.map(t => t.id === taskToSave.id ? taskToSave : t);
      return [...prev, taskToSave];
    });

    if (getApiUrl()) {
      await api.saveTask(taskToSave);
      fetchData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (getApiUrl()) {
      await api.deleteTask(taskId);
      fetchData();
    }
  };

  const handleAddUser = async (newUser: User) => {
    setTeamUsers(prev => [...prev, newUser]);
    if (getApiUrl()) {
      await api.saveUser(newUser);
      fetchData();
    }
  };

  const handleEditUser = async (updatedUser: User) => {
    // Preserve password if not being edited explicitly here
    // But we need to ensure we don't lose the password if the modal sends a user object without it
    setTeamUsers(prev => prev.map(u => {
        if (u.id === updatedUser.id) {
            // If the incoming update doesn't have a password but the local one does, keep the local one
            if (!updatedUser.password && u.password) {
                return { ...updatedUser, password: u.password };
            }
            return updatedUser;
        }
        return u;
    }));

    if (currentUser.id === updatedUser.id) {
       // Similar logic for current user
       setCurrentUser(prev => {
         if (!updatedUser.password && prev.password) {
           return { ...updatedUser, password: prev.password };
         }
         return updatedUser;
       });
    }

    if (getApiUrl()) {
      // Ensure we send the password to the server if we have it locally
      const userToSend = { ...updatedUser };
      const localUser = teamUsers.find(u => u.id === updatedUser.id);
      if (localUser?.password && !userToSend.password) {
          userToSend.password = localUser.password;
      }
      await api.saveUser(userToSend);
      fetchData();
    }
  };
  
  const handleRemoveUser = async (userId: string) => {
    setTeamUsers(prev => prev.filter(u => u.id !== userId));
    if (getApiUrl()) {
      await api.deleteUser(userId);
      fetchData();
    }
  };
  
  const handleAddTeam = async (newTeam: Team) => {
    setTeams(prev => [...prev, newTeam]);
    if (getApiUrl()) {
      await api.saveTeam(newTeam);
      fetchData();
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    if (getApiUrl()) {
      await api.deleteTeam(teamId);
      fetchData();
    }
  };

  const handleSaveAlert = async (newAlert: AlertPeriod) => {
    setAlertPeriods(prev => [...prev, newAlert]);
    if (getApiUrl()) {
      await api.saveAlert(newAlert);
      fetchData();
    }
  };

  const handleTogglePresence = async (userId: string, dateStr: string) => {
     let updatedUser: User | undefined;
     setTeamUsers(prev => prev.map(user => {
       if (user.id === userId) {
         const isPresent = user.presencialDates.includes(dateStr);
         const newDates = isPresent 
           ? user.presencialDates.filter(d => d !== dateStr) 
           : [...user.presencialDates, dateStr];
         updatedUser = { ...user, presencialDates: newDates };
         return updatedUser;
       }
       return user;
     }));
     if (updatedUser && getApiUrl()) await api.saveUser(updatedUser);
  };

  const isLeader = currentUser.role === 'LEADER' || currentUser.role === 'COORDINATOR';
  const isCoordinator = currentUser.role === 'COORDINATOR';

  const displayedTasks = tasks.filter(task => {
    const assignee = teamUsers.find(u => u.id === task.assigneeId);
    if (!assignee) return false;

    if (filterScope === 'ME') {
      return assignee.id === currentUser.id;
    }
    
    if (filterScope === 'MY_TEAM') {
      return assignee.teamId === currentUser.teamId;
    }
    
    if (filterScope === 'ALL_TEAMS') {
      return true;
    }
    
    return assignee.teamId === filterScope;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar - Adjusted Layout */}
      <aside className="w-16 lg:w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-xl z-20 transition-all">
        {/* Updated Title and Slogan - Stacked but minimal */}
        <div className="p-4 lg:p-6 border-b border-slate-800 flex items-center justify-center lg:justify-start gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shrink-0">
             <Layout size={24} />
          </div>
          <div className="hidden lg:flex flex-col">
             <h1 className="text-xl font-bold tracking-tight text-white leading-none mb-1">GestãoPRO</h1>
             <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Organizador de Demandas</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setViewMode('CALENDAR')} className={`w-full px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 font-medium transition-colors ${viewMode === 'CALENDAR' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <CheckSquare size={20} />
            <span className="hidden lg:inline">Minhas Demandas</span>
          </button>

          <button onClick={() => setViewMode('DASHBOARD')} className={`w-full px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 font-medium transition-colors ${viewMode === 'DASHBOARD' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <PieChart size={20} />
            <span className="hidden lg:inline">Indicadores</span>
          </button>

          <button onClick={() => setIsPresencialModalOpen(true)} className="w-full px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 font-medium transition-colors hover:bg-slate-800 text-slate-400">
            <MapPin size={20} />
            <span className="hidden lg:inline">Escala Presencial</span>
          </button>
          
          {isLeader && (
            <>
              <div className="my-2 border-t border-slate-800"></div>
              <button onClick={() => setIsTeamModalOpen(true)} className="w-full px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 font-medium transition-colors hover:bg-slate-800 text-slate-400">
                <Settings size={20} />
                <span className="hidden lg:inline">Gerenciar Equipe</span>
              </button>
              <button onClick={() => setIsAlertModalOpen(true)} className="w-full px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 font-medium transition-colors hover:bg-slate-800 text-orange-400">
                <AlertTriangle size={20} />
                <span className="hidden lg:inline">Criar Alerta</span>
              </button>
            </>
          )}
        </nav>

        {/* Database Config */}
        <div className="p-2 bg-slate-950">
           <button 
             onClick={() => { setIsConfigOpen(true); setConfigError(null); }}
             className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
             title={connectionStatus === 'CONNECTED' ? 'Conexão Ativa' : 'Sem Conexão'}
           >
              <div className="relative">
                 <Database size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                 <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                    connectionStatus === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                    connectionStatus === 'ERROR' ? 'bg-red-500' : 
                    'bg-slate-600'
                 }`}></div>
              </div>
              <span className="hidden lg:inline text-sm font-medium text-slate-300 group-hover:text-white">
                Banco de Dados
              </span>
              {isSyncing && <Loader2 size={14} className="animate-spin ml-auto text-slate-500" />}
           </button>
        </div>

        {/* User Switcher with Password Protection */}
        <div className="relative border-t border-slate-800 bg-slate-950 p-2">
           <button 
             onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
             className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded hover:bg-slate-800 transition-colors"
           >
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                 <Users size={16} className="text-slate-300" />
              </div>
              <div className="hidden lg:block text-left">
                 <div className="text-xs font-bold text-slate-400">Alternar Usuário</div>
              </div>
           </button>

           {isUserSwitcherOpen && (
              <div className="absolute bottom-full left-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl mb-2 p-1 z-50 max-h-60 overflow-y-auto">
                 {teamUsers.map(u => (
                   <button
                     key={u.id}
                     onClick={() => handleUserSwitchClick(u)}
                     className={`w-full flex items-center gap-2 p-2 rounded text-sm ${currentUser.id === u.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                   >
                     <img src={u.avatar} className="w-6 h-6 rounded-full" alt=""/>
                     <span className="truncate">{u.name}</span>
                     {!u.password && <span className="ml-auto w-2 h-2 rounded-full bg-red-500" title="Sem senha"></span>}
                   </button>
                 ))}
              </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 gap-4">
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('CALENDAR')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  viewMode === 'CALENDAR' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CalendarIcon size={16} />
                <span className="hidden sm:inline">Calendário</span>
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List size={16} />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            {(viewMode === 'CALENDAR' || viewMode === 'LIST') && (
               <div className="flex items-center gap-2">
                 <Filter size={16} className="text-slate-400" />
                 <select 
                   value={filterScope}
                   onChange={(e) => setFilterScope(e.target.value)}
                   className="bg-slate-50 border-none text-sm font-medium text-slate-700 rounded-md focus:ring-0 cursor-pointer hover:bg-slate-100 py-1.5 pl-2 pr-8"
                 >
                    <option value="ME">Apenas Minhas</option>
                    <option value="MY_TEAM">Minha Equipe</option>
                    {isCoordinator && (
                      <>
                        <option disabled>──────────</option>
                        <option value="ALL_TEAMS">Todas as Equipes</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>Equipe: {team.name}</option>
                        ))}
                      </>
                    )}
                 </select>
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            {/* Change Password Button */}
            <button 
               onClick={handleChangePasswordClick}
               className="text-slate-400 hover:text-indigo-600 transition-colors"
               title="Alterar Senha"
            >
               <KeyRound size={18} />
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
                <div className="text-xs text-slate-500">
                   {currentUser.role === 'COORDINATOR' ? 'Coordenador' : currentUser.role === 'LEADER' ? 'Líder' : 'Membro'}
                </div>
              </div>
              <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full border border-slate-200 shadow-sm" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col bg-slate-50">
          <div className="flex-1 h-full min-h-0">
            {viewMode === 'CALENDAR' ? (
              <Calendar 
                tasks={displayedTasks} 
                users={teamUsers}
                alertPeriods={alertPeriods}
                currentUser={currentUser}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
              />
            ) : viewMode === 'LIST' ? (
              <TaskListView 
                tasks={displayedTasks}
                currentUser={currentUser}
                onEditTask={handleEditTask}
              />
            ) : (
              <DashboardView 
                tasks={tasks} 
                users={teamUsers}
              />
            )}
          </div>
        </div>
      </main>

      {/* Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200 relative">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                 <X size={24} />
              </button>

              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Database size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Conectar Google Sheets</h2>
              <p className="text-slate-500 text-sm mb-6">
                 Para sincronizar dados entre a equipe, insira a URL do Web App do Google Apps Script abaixo.
              </p>
              
              {configError && (
                 <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2 text-left">
                    <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>{configError}</div>
                 </div>
              )}

              <div className="text-left mb-4">
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL da API (Script Google)</label>
                 <div className="flex gap-2">
                   <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={apiUrlInput}
                        onChange={(e) => setApiUrlInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                   </div>
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsConfigOpen(false)}
                   className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                 >
                   Usar Offline (Demo)
                 </button>
                 <button 
                   onClick={handleConnect}
                   disabled={!apiUrlInput || isSyncing}
                   className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                   {isSyncing ? <Loader2 size={16} className="animate-spin" /> : 'Conectar e Sincronizar'}
                 </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400 text-left">
                 <p className="mb-2 font-bold">Instruções:</p>
                 <ol className="list-decimal pl-4 space-y-1">
                    <li>Copie o novo código do Apps Script (versão com senha).</li>
                    <li>Vá em <strong>Implantar</strong> {'>'} <strong>Nova implantação</strong>.</li>
                    <li>Cole a URL gerada acima.</li>
                 </ol>
              </div>
           </div>
        </div>
      )}

      {/* Auth Modal (Password) */}
      <UserAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetUser={authTargetUser}
        mode={authMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Other Modals */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onRequestTransfer={() => {}} 
        initialTask={selectedTask}
        selectedDate={selectedDate}
        currentUser={currentUser}
        users={teamUsers}
        teams={teams}
      />
      
      <TeamModal 
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        users={teamUsers}
        teams={teams}
        onAddUser={handleAddUser}
        onEditUser={handleEditUser}
        onRemoveUser={handleRemoveUser}
        onAddTeam={handleAddTeam}
        onRemoveTeam={handleRemoveTeam}
      />

      <AlertModal 
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSave={handleSaveAlert}
      />

      <PresencialModal 
        isOpen={isPresencialModalOpen}
        onClose={() => setIsPresencialModalOpen(false)}
        users={teamUsers}
        onTogglePresence={handleTogglePresence}
      />
    </div>
  );
};

export default App;