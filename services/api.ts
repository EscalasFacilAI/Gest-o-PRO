import { Task, User, AlertPeriod, Team } from '../types';

// This will be set by the user in the UI
let API_URL = localStorage.getItem('GESTOR_PRO_API_URL') || '';

export const setApiUrl = (url: string) => {
  // Simple validation to warn about dev URLs
  if (url.includes('/dev')) {
    console.warn("Warning: You are using a deployment '/dev' URL. This usually fails due to CORS/Auth. Use '/exec'.");
  }
  API_URL = url;
  localStorage.setItem('GESTOR_PRO_API_URL', url);
};

export const getApiUrl = () => API_URL;

const sendRequest = async (action: string, data?: any) => {
  if (!API_URL) throw new Error('API URL not configured');

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
      // If parsing fails, it's likely an HTML error page from Google (404, 500, Permission)
      console.error("API Error (Raw Response):", text);
      throw new Error("Falha na comunicação com o Google Sheets. Verifique o console para detalhes (CORS ou Permissão).");
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
      date: task.date.toISOString(),
    });
  },

  deleteTask: async (taskId: string) => {
    return sendRequest('deleteTask', { id: taskId });
  },

  saveUser: async (user: User) => {
    return sendRequest('saveUser', user);
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
      startDate: alert.startDate.toISOString(),
      endDate: alert.endDate.toISOString(),
    });
  }
};