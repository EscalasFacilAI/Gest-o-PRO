
import { Task, User, AlertPeriod, Team } from '../types';
import { format } from 'date-fns';

// --- CONFIGURAÇÃO DA API ---
// A URL fornecida foi inserida diretamente aqui.
const HARDCODED_API_URL = 'https://script.google.com/macros/s/AKfycbygXY4MhhZkQDs6cDr52C7sig-kRM9sgWmfSd6lklKuuE25VWrGgIX6azDyD2TmBpqPug/exec'; 

// Fallback para localStorage caso queira manter compatibilidade, mas prioriza a hardcoded
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

  try {
    let response;
    
    if (action === 'read') {
      response = await fetch(`${API_URL}?action=read`);
    } else {
      response = await fetch(`${API_URL}?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain' } 
      });
    }

    const text = await response.text();
    
    // Try parsing JSON
    try {
      const json = JSON.parse(text);
      if (json.error) {
        throw new Error("Server Error: " + json.error);
      }
      return json;
    } catch (e) {
      console.error("API Error (Raw Response):", text);
      throw new Error("Falha na comunicação com o Google Sheets. Verifique o console ou a URL da API.");
    }

  } catch (error) {
    console.error("Network/Script Error:", error);
    throw error;
  }
};

export const api = {
  sync: async (): Promise<{ tasks: any[], users: any[], alerts: any[], teams: any[] }> => {
    return sendRequest('read');
  },
  
  saveTask: async (task: Task) => {
    return sendRequest('saveTask', {
      ...task,
      date: format(task.date, 'yyyy-MM-dd'),
      // IMPORTANT: Convert object to string for storage in Google Sheets cell
      teamProgress: JSON.stringify(task.teamProgress || {})
    });
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
  }
};
