
import React, { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import TaskModal from './components/TaskModal';
import TaskListView from './components/TaskListView';
import TeamModal from './components/TeamModal';
import AlertModal from './components/AlertModal';
import DashboardView from './components/DashboardView';
import PresencialModal from './components/PresencialModal';
import UserAuthModal from './components/UserAuthModal'; 
import LoginScreen from './components/LoginScreen';

import { User, Task, AlertPeriod, Team, Notification, TaskStatus } from './types';
import { USERS, INITIAL_TASKS, INITIAL_TEAMS } from './constants';
import { api, getApiUrl } from './services/api';
import { Layout, CheckSquare, List, Calendar as CalendarIcon, Settings, PieChart, MapPin, AlertTriangle, Users, Database, Loader2, Filter, KeyRound, Bell, LogOut } from 'lucide-react';
import { format, isValid } from 'date-fns';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); 
  
  // Data State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [alertPeriods, setAlertPeriods] = useState<AlertPeriod[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST' | 'DASHBOARD'>('CALENDAR');
  const [filterScope, setFilterScope] = useState<string>('MY_TEAM'); 
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL'); 
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isPresencialModalOpen, setIsPresencialModalOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTargetUser, setAuthTargetUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'CHANGE_PASSWORD'>('LOGIN');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Refs
  const userSwitcherRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<Task[]>([]);
  const currentUserRef = useRef<User>(currentUser);
  const isFirstLoadRef = useRef(true);

  // Keep refs synced
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSwitcherRef.current && !userSwitcherRef.current.contains(event.target as Node)) {
        setIsUserSwitcherOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- API & SYNC LOGIC ---
  const fetchData = async (): Promise<boolean> => {
    if (!getApiUrl()) {
        // Fallback demo mode if no URL is hardcoded
        setTasks(INITIAL_TASKS);
        setTeamUsers(USERS);
        setTeams(INITIAL_TEAMS);
        setIsLoadingInitial(false);
        return false;
    }
    
    try {
      setIsSyncing(true);
      const data = await api.sync();
      
      // PARSE TASKS
      const parsedTasks: Task[] = data.tasks.map((t: any) => {
        let dateObj;
        if (typeof t.date === 'string' && t.date.includes('-') && !t.date.includes('T')) {
           const [y, m, d] = t.date.split('-').map(Number);
           dateObj = new Date(y, m - 1, d);
        } else if (typeof t.date === 'string') {
           const datePart = t.date.substring(0, 10);
           if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
             const [y, m, d] = datePart.split('-').map(Number);
             dateObj = new Date(y, m - 1, d);
           } else {
             dateObj = new Date(t.date);
           }
        } else {
           dateObj = new Date(t.date);
        }

        const cleanTime = (val: any) => {
          if (!val) return '';
          const strVal = String(val);
          if (strVal.match(/^\d{1,2}:\d{2}$/)) return strVal;
          const d = new Date(strVal);
          if (isValid(d)) return format(d, 'HH:mm');
          return strVal;
        };

        // Handle teamProgress JSON string if it comes from stringified source
        let tp = t.teamProgress;
        if (typeof tp === 'string') {
          try { tp = JSON.parse(tp); } catch(e) { tp = {}; }
        }

        return { 
          ...t, 
          title: t.title || 'Sem título', 
          date: dateObj,
          startTime: cleanTime(t.startTime),
          endTime: cleanTime(t.endTime),
          teamProgress: tp || {}
        };
      });

      const parsedAlerts: AlertPeriod[] = data.alerts.map((a: any) => {
         let start, end;
         if (typeof a.startDate === 'string') {
            const datePart = a.startDate.substring(0, 10);
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
               const [y, m, d] = datePart.split('-').map(Number);
               start = new Date(y, m - 1, d);
            } else start = new Date(a.startDate);
         } else start = new Date(a.startDate);

         if (typeof a.endDate === 'string') {
             const datePart = a.endDate.substring(0, 10);
             if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = datePart.split('-').map(Number);
                end = new Date(y, m - 1, d);
             } else end = new Date(a.endDate);
         } else end = new Date(a.endDate);

         return { ...a, startDate: start, endDate: end };
      });

      const parsedUsers: User[] = data.users.map((u: any) => ({
        ...u,
        presencialDates: Array.isArray(u.presencialDates) ? u.presencialDates : [],
        password: (u.password !== undefined && u.password !== null && u.password !== '') ? String(u.password) : undefined
      }));
      
      const parsedTeams: Team[] = data.teams || [];

      updateNotifications(parsedTasks);
      isFirstLoadRef.current = false;
      setTasks(parsedTasks);
      
      // Update Users List (merging passwords if needed locally, but usually fresh from API)
      if (parsedUsers.length > 0) {
        setTeamUsers(parsedUsers);
      } else {
        setTeamUsers(USERS); // Fallback
      }

      if (parsedTeams.length > 0) setTeams(parsedTeams);
      else setTeams(INITIAL_TEAMS);

      setAlertPeriods(parsedAlerts);
      setConnectionStatus('CONNECTED');
      setIsLoadingInitial(false);
      return true;
    } catch (error) {
      console.error("Sync Error", error);
      setConnectionStatus('ERROR');
      setIsLoadingInitial(false);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial Fetch on Mount
  useEffect(() => {
    fetchData();
    // AUMENTADO PARA 60 SEGUNDOS (1 MIN) CONFORME SOLICITADO
    const intervalId = setInterval(fetchData, 60000); 
    return () => clearInterval(intervalId);
  }, []); 

  // --- NOTIFICATION LOGIC ---
  const updateNotifications = (currentTasks: Task[]) => {
      setNotifications(prev => {
         const readIds = JSON.parse(localStorage.getItem('GEST_PRO_READ_NOTIFS') || '[]');
         const currentIds = new Set(prev.map(n => n.id));
         const incomingNotifications: Notification[] = [];
         const myId = currentUserRef.current.id;

         currentTasks.forEach(task => {
             if (task.isNudged) {
                 const notifId = `${task.id}_nudge`;
                 // Logic updated: If it's a team task, verify if *I* am responsible
                 const isMyResponsibility = task.assigneeId === myId || (teams.some(t => t.id === task.assigneeId) && currentUserRef.current.teamId === task.assigneeId);

                 if (isMyResponsibility && !readIds.includes(notifId) && !currentIds.has(notifId)) {
                     const title = task.title && task.title.trim() !== '' ? task.title : 'Tarefa sem título';
                     incomingNotifications.push({
                        id: notifId,
                        targetUserId: myId,
                        message: `⚠️ URGENTE: A demanda "${title}" foi cobrada!`,
                        date: new Date(),
                        read: false,
                        type: 'NUDGE'
                     });
                     currentIds.add(notifId);
                 }
             }
         });

         if (!isFirstLoadRef.current && tasksRef.current.length > 0) {
            currentTasks.forEach(newTask => {
                const oldTask = tasksRef.current.find(t => t.id === newTask.id);
                // Notification for assignments
                // Only notify if assignment CHANGED or it's new
                if ((!oldTask || oldTask.assigneeId !== newTask.assigneeId)) {
                   const isAssignedToMe = newTask.assigneeId === myId;
                   const isAssignedToMyTeam = teams.some(t => t.id === newTask.assigneeId) && currentUserRef.current.teamId === newTask.assigneeId;

                   if (isAssignedToMe || isAssignedToMyTeam) {
                      const notifId = `assign_${newTask.id}_${newTask.assigneeId}`;
                      if (!currentIds.has(notifId) && !readIds.includes(notifId)) {
                          const title = newTask.title && newTask.title.trim() !== '' ? newTask.title : 'Tarefa sem título';
                          incomingNotifications.push({ 
                              id: notifId, 
                              targetUserId: myId,
                              message: isAssignedToMyTeam ? `Nova demanda para equipe: ${title}` : `Nova demanda atribuída: ${title}`, 
                              date: new Date(), 
                              read: false, 
                              type: 'TASK_ASSIGNED' 
                          });
                          currentIds.add(notifId);
                      }
                   }
                }
            });
         }
         if (incomingNotifications.length === 0) return prev;
         return [...incomingNotifications, ...prev];
      });
  };

  useEffect(() => {
    if (isAuthenticated) setFilterScope('MY_TEAM');
  }, [currentUser.id, isAuthenticated]);

  const handleMarkAsRead = () => {
     const currentRead = JSON.parse(localStorage.getItem('GEST_PRO_READ_NOTIFS') || '[]');
     const newIds = notifications.filter(n => n.targetUserId === currentUser.id).map(n => n.id);
     localStorage.setItem('GEST_PRO_READ_NOTIFS', JSON.stringify([...new Set([...currentRead, ...newIds])]));
     setNotifications(prev => prev.filter(n => n.targetUserId !== currentUser.id));
  };

  // --- LOGIN FLOW HANDLERS ---
  const handleLoginClick = (user: User) => {
    setAuthTargetUser(user);
    setAuthMode('LOGIN');
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = async (updatedUser?: User) => {
     if (updatedUser) {
        setTeamUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        if (getApiUrl()) await api.saveUser(updatedUser);
     } else if (authTargetUser) {
        setCurrentUser(authTargetUser);
     }
     setIsAuthenticated(true);
     setAuthTargetUser(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setViewMode('CALENDAR');
    setIsUserSwitcherOpen(false);
  };

  // --- AUTH HANDLERS (Inside App) ---
  const handleUserSwitchClick = (user: User) => {
    setAuthTargetUser(user);
    setAuthMode('LOGIN');
    setIsAuthModalOpen(true);
    setIsUserSwitcherOpen(false); 
  };

  const handleChangePasswordClick = () => {
    setAuthTargetUser(currentUser);
    setAuthMode('CHANGE_PASSWORD');
    setIsAuthModalOpen(true);
  };

  const handleAuthModalSuccess = async (updatedUser?: User) => {
    if (updatedUser) {
        setTeamUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        if (getApiUrl()) await api.saveUser(updatedUser);
        if (authMode === 'CHANGE_PASSWORD') alert("Senha alterada com sucesso!");
    } else if (authTargetUser) {
       setCurrentUser(authTargetUser);
       setIsAuthenticated(true); 
    }
  };


  // --- DATA HANDLERS ---
  const handleAddTask = (date: Date) => { setSelectedDate(date); setSelectedTask(null); setIsModalOpen(true); };
  const handleEditTask = (task: Task) => { setSelectedTask(task); setSelectedDate(task.date); setIsModalOpen(true); };
  
  const handleSaveTask = async (taskToSave: Task) => {
    const safeTask = { 
       ...taskToSave, 
       title: taskToSave.title || 'Sem título',
       teamProgress: taskToSave.teamProgress || {} // Ensure property exists
    };
    setTasks(prev => {
      const exists = prev.find(t => t.id === safeTask.id);
      return exists ? prev.map(t => t.id === safeTask.id ? safeTask : t) : [...prev, safeTask];
    });
    if (getApiUrl()) { await api.saveTask(safeTask); fetchData(); }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (getApiUrl()) { await api.deleteTask(taskId); fetchData(); }
  };

  const handleAddUser = async (newUser: User) => {
    setTeamUsers(prev => [...prev, newUser]);
    if (getApiUrl()) { await api.saveUser(newUser); fetchData(); }
  };

  const handleEditUser = async (updatedUser: User) => {
    setTeamUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser.id === updatedUser.id) setCurrentUser(prev => ({...prev, ...updatedUser}));
    if (getApiUrl()) {
      const localUser = teamUsers.find(u => u.id === updatedUser.id);
      const userToSend = { ...updatedUser };
      if (localUser?.password && !userToSend.password) userToSend.password = localUser.password;
      await api.saveUser(userToSend);
      fetchData();
    }
  };
  
  const handleRemoveUser = async (userId: string) => {
    setTeamUsers(prev => prev.filter(u => u.id !== userId));
    if (getApiUrl()) { await api.deleteUser(userId); fetchData(); }
  };
  
  const handleAddTeam = async (newTeam: Team) => {
    setTeams(prev => [...prev, newTeam]);
    if (getApiUrl()) { await api.saveTeam(newTeam); fetchData(); }
  };

  const handleRemoveTeam = async (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    if (getApiUrl()) { await api.deleteTeam(teamId); fetchData(); }
  };

  const handleSaveAlert = async (newAlert: AlertPeriod) => {
    setAlertPeriods(prev => {
       const exists = prev.find(a => a.id === newAlert.id);
       return exists ? prev.map(a => a.id === newAlert.id ? newAlert : a) : [...prev, newAlert];
    });
    if (getApiUrl()) { await api.saveAlert(newAlert); fetchData(); }
  };
  
  const handleDeleteAlert = async (alertId: string) => {
     setAlertPeriods(prev => prev.filter(a => a.id !== alertId));
     if (getApiUrl()) { await api.deleteAlert(alertId); fetchData(); }
  };

  const handleBatchUpdatePresence = async (updatedUsers: User[]) => {
     setTeamUsers(prev => prev.map(u => updatedUsers.find(upd => upd.id === u.id) || u));
     if (getApiUrl()) { await api.saveUsersBatch(updatedUsers); fetchData(); }
  };

  const isLeader = currentUser.role === 'LEADER' || currentUser.role === 'COORDINATOR';
  const isCoordinator = currentUser.role === 'COORDINATOR';

  const displayedTasks = tasks.filter(task => {
    // Check if task is assigned to a User OR a Team
    const assigneeUser = teamUsers.find(u => u.id === task.assigneeId);
    const assigneeTeam = teams.find(t => t.id === task.assigneeId);
    
    let passesScope = false;
    
    // Scope Logic
    if (filterScope === 'ME') {
        // Show if assigned to ME directly OR assigned to MY TEAM (Group Task)
        passesScope = task.assigneeId === currentUser.id || task.assigneeId === currentUser.teamId;
    }
    else if (filterScope === 'MY_TEAM') {
        // Show if assigned user belongs to my team OR assigned directly to my team
        if (assigneeUser) passesScope = assigneeUser.teamId === currentUser.teamId;
        else if (assigneeTeam) passesScope = assigneeTeam.id === currentUser.teamId;
        else passesScope = false; 
    }
    else if (filterScope === 'ALL_TEAMS') {
        passesScope = true;
    }
    else {
        // Specific Team ID selected
        if (assigneeUser) passesScope = assigneeUser.teamId === filterScope;
        else if (assigneeTeam) passesScope = assigneeTeam.id === filterScope;
    }

    if (!passesScope) return false;
    if (viewMode === 'LIST' && filterStatus !== 'ALL') if (task.status !== filterStatus) return false;
    return true;
  });
  
  const displayedAlerts = alertPeriods.filter(alert => {
     if (!alert.targetTeamId || alert.targetTeamId === 'ALL') return true;
     return alert.targetTeamId === currentUser.teamId || isCoordinator;
  });

  const myNotifications = notifications.filter(n => n.targetUserId === currentUser.id);
  const safeDate = (d: any) => (d instanceof Date && !isNaN(d.getTime())) ? d : (typeof d === 'string' ? new Date(d) : new Date());

  // --- RENDER ---

  if (!isAuthenticated) {
     return (
       <>
         <LoginScreen 
            users={teamUsers} 
            teams={teams}
            onLogin={handleLoginClick} 
            isLoading={isLoadingInitial}
         />
         <UserAuthModal 
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            targetUser={authTargetUser}
            mode={authMode}
            onSuccess={handleLoginSuccess}
         />
       </>
     );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-16 lg:w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-xl z-20 transition-all">
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

          <button onClick={() => { setViewMode('DASHBOARD'); setFilterStatus('ALL'); }} className={`w-full px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-3 font-medium transition-colors ${viewMode === 'DASHBOARD' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
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

        <div className="p-2 bg-slate-950">
           <div className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group cursor-default">
              <div className="relative">
                 <Database size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                 <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                    connectionStatus === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                    connectionStatus === 'ERROR' ? 'bg-red-500' : 'bg-slate-600'
                 }`}></div>
              </div>
              <span className="hidden lg:inline text-sm font-medium text-slate-300 group-hover:text-white">
                {connectionStatus === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
              </span>
              {isSyncing && <Loader2 size={14} className="animate-spin ml-auto text-slate-500" />}
           </div>
        </div>

        <div className="relative border-t border-slate-800 bg-slate-950 p-2" ref={userSwitcherRef}>
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
                 <div className="border-t border-slate-700 mt-1 pt-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2 text-red-400 hover:bg-slate-700 rounded text-sm">
                        <LogOut size={14} /> Sair do Sistema
                    </button>
                 </div>
              </div>
           )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
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
                onClick={() => { setViewMode('LIST'); setFilterStatus('ALL'); }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List size={16} />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            {(viewMode === 'CALENDAR' || viewMode === 'LIST' || viewMode === 'DASHBOARD') && (
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
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="text-slate-400 hover:text-indigo-600 transition-colors relative"
              >
                 <Bell size={20} />
                 {myNotifications.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
                 )}
              </button>
              
              {isNotificationsOpen && (
                 <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                        Notificações ({myNotifications.length})
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                       {myNotifications.length === 0 ? (
                         <div className="p-4 text-center text-xs text-slate-400">Nenhuma notificação nova.</div>
                       ) : (
                        myNotifications.map(n => (
                           <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <p className={`text-sm mb-1 ${n.type === 'NUDGE' ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                                 {n.message || 'Nova Notificação'}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">
                                 {format(safeDate(n.date), 'dd/MM HH:mm')}
                              </span>
                           </div>
                         ))
                       )}
                    </div>
                    {myNotifications.length > 0 && (
                        <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                            <button onClick={handleMarkAsRead} className="text-xs text-indigo-600 font-medium hover:underline">
                                Marcar como lidas
                            </button>
                        </div>
                    )}
                 </div>
              )}
            </div>

            <button onClick={handleChangePasswordClick} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Alterar Senha">
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

        <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col bg-slate-50">
          <div className="flex-1 h-full min-h-0">
            {viewMode === 'CALENDAR' ? (
              <Calendar 
                tasks={displayedTasks} 
                users={teamUsers}
                teams={teams}
                alertPeriods={displayedAlerts}
                currentUser={currentUser}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
              />
            ) : viewMode === 'LIST' ? (
              <TaskListView 
                tasks={displayedTasks}
                currentUser={currentUser}
                users={teamUsers}
                teams={teams}
                onEditTask={handleEditTask}
              />
            ) : (
              <DashboardView 
                tasks={displayedTasks} 
                users={teamUsers}
                onFilterRequest={(status) => {
                   setFilterStatus(status);
                   setViewMode('LIST');
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Auth Modal (Password Change / Login inside app) */}
      <UserAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        targetUser={authTargetUser}
        mode={authMode}
        onSuccess={handleAuthModalSuccess}
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
        onDelete={handleDeleteAlert}
        alertPeriods={alertPeriods}
        teams={teams}
      />

      <PresencialModal 
        isOpen={isPresencialModalOpen}
        onClose={() => setIsPresencialModalOpen(false)}
        users={teamUsers}
        teams={teams}
        currentUser={currentUser}
        onSavePresence={handleBatchUpdatePresence}
      />
    </div>
  );
};

export default App;
