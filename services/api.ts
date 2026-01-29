
import { Task, User, AlertPeriod, Team, Note } from '../types';
import { format } from 'date-fns';

// --- CONFIGURAÇÃO DA API ---
const HARDCODED_API_URL = 'https://script.google.com/macros/s/AKfycbxq8rmU57n3I0qVxfAf3cjiKflAlkd1_8ixNEcGpjH0CwjcslQCz4ht7308Jmj88yDFDA/exec'; 

let API_URL = HARDCODED_API_URL && HARDCODED_API_URL.startsWith('http') 
  ? HARDCODED_API_URL 
  : (localStorage.getItem('GESTOR_PRO_API_URL') || '');

export const setApiUrl = (url: string) => {
  if (url.includes('/dev')) {
    console.warn("Warning: You are using a deployment '/dev' URL. This usually fails due to CORS/Auth. Use '/exec'.");
  }
  API_URL = url;
  localStorage.setItem('GESTOR_PRO_API_URL', url);
};

export const getApiUrl = () => API_URL;

const sendRequest = async (action: string, data?: any) => {
  if (!API_URL || API_URL.includes('INSIRA_SUA_URL')) {
     console.warn("API URL não configurada no código fonte.");
     throw new Error('API URL not configured');
  }

  // Cache busting param
  const cacheBuster = `&_t=${new Date().getTime()}`;
  const url = `${API_URL}?action=${action}${cacheBuster}`;

  try {
    let response;
    
    // Configuração para CORS
    const requestOptions: RequestInit = {
       cache: 'no-store',
       headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    };

    if (action === 'read') {
      response = await fetch(`${API_URL}?action=read${cacheBuster}`, {
         ...requestOptions, method: 'GET'
      });
    } else {
      response = await fetch(`${API_URL}?action=${action}${cacheBuster}`, {
        ...requestOptions, method: 'POST', body: JSON.stringify(data),
      });
    }

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const text = await response.text();
    
    try {
      const json = JSON.parse(text);
      if (json.error) {
        if (json.error.includes("Server busy")) throw new Error("BUSY");
        throw new Error("Server Error: " + json.error);
      }
      return json;
    } catch (e: any) {
      if (e.message === "BUSY") throw e;
      console.error("API Error (Raw Response):", text);
      throw new Error("Falha na estrutura de dados do servidor.");
    }

  } catch (error) {
    console.error("Network/Script Error:", error);
    throw error;
  }
};

export const api = {
  sync: async (): Promise<{ tasks: any[], users: any[], alerts: any[], teams: any[], notes: any[] }> => {
    return sendRequest('read');
  },
  
  saveTask: async (task: Task) => {
    return sendRequest('saveTask', {
      ...task,
      date: format(task.date, 'yyyy-MM-dd'),
      teamProgress: JSON.stringify(task.teamProgress || {})
    });
  },

  // Nova função para salvar várias tarefas (Recorrência)
  saveTasksBatch: async (tasks: Task[]) => {
    const payload = tasks.map(t => ({
      ...t,
      date: format(t.date, 'yyyy-MM-dd'),
      teamProgress: JSON.stringify(t.teamProgress || {})
    }));
    return sendRequest('saveTasksBatch', payload);
  },

  deleteTask: async (taskId: string) => {
    return sendRequest('deleteTask', { id: taskId });
  },

  saveUser: async (user: User) => {
    return sendRequest('saveUser', user);
  },
  
  saveUsersBatch: async (users: User[]) => {
    return sendRequest('saveUsersBatch', users);
  },

  deleteUser: async (userId: string) => {
    return sendRequest('deleteUser', { id: userId });
  },

  saveTeam: async (team: Team) => {
    return sendRequest('saveTeam', team);
  },
  
  deleteTeam: async (teamId: string) => {
    return sendRequest('deleteTeam', { id: teamId });
  },

  saveAlert: async (alert: AlertPeriod) => {
    return sendRequest('saveAlert', {
      ...alert,
      startDate: format(alert.startDate, 'yyyy-MM-dd'),
      endDate: format(alert.endDate, 'yyyy-MM-dd'),
    });
  },

  deleteAlert: async (alertId: string) => {
    return sendRequest('deleteAlert', { id: alertId });
  },

  saveNote: async (note: Note) => {
    return sendRequest('saveNote', {
        ...note,
        updatedAt: format(note.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    });
  },

  deleteNote: async (noteId: string) => {
    return sendRequest('deleteNote', { id: noteId });
  }
};
