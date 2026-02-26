
export type Role = 'COORDINATOR' | 'LEADER' | 'MEMBER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type AlertColor = 'RED' | 'ORANGE' | 'BLUE' | 'PURPLE' | 'GREEN' | 'TEAL' | 'PINK' | 'CYAN' | 'LIME' | 'GRAY' | 'INDIGO';

export interface Team {
  id: string;
  name: string;
  color: string; // Hex or tailwind class reference
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId: string;
  avatar: string;
  presencialDates: string[]; // Array of ISO date strings (yyyy-MM-dd)
  password?: string; 
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  targetTeamId?: string; // Optional: If specific to a team context
  creatorId: string; // ID of the user who created the task
  isPrivate?: boolean; // If true, only visible to creator
  date: Date; // Normalized to midnight
  startTime?: string; // Format "HH:mm"
  endTime?: string;   // Format "HH:mm"
  status: TaskStatus;
  priority: Priority;
  isNudged?: boolean; // If true, it was "Cobrada"
  teamProgress?: Record<string, TaskStatus>; // Map userId -> status for team tasks
}

export interface AlertPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
  color: AlertColor;
  targetTeamId?: string | 'ALL'; // Filter alert by team
}

export interface Notification {
  id: string;
  targetUserId: string; // Who should see this
  message: string;
  date: Date;
  read: boolean;
  type: 'TASK_ASSIGNED' | 'NUDGE';
}

// Helper to keep dates consistent
export const normalizeDate = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Helper for colors
export const ALERT_COLOR_MAP: Record<AlertColor, { bg: string, border: string, text: string, icon: string, bar: string }> = {
  RED: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500', bar: 'bg-red-500' },
  ORANGE: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500', bar: 'bg-orange-500' },
  BLUE: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', bar: 'bg-blue-500' },
  PURPLE: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', bar: 'bg-purple-500' },
  GREEN: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', bar: 'bg-emerald-500' },
  TEAL: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'text-teal-500', bar: 'bg-teal-500' },
  PINK: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: 'text-pink-500', bar: 'bg-pink-500' },
  CYAN: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-500', bar: 'bg-cyan-500' },
  LIME: { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', icon: 'text-lime-500', bar: 'bg-lime-500' },
  GRAY: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', icon: 'text-slate-500', bar: 'bg-slate-500' },
  INDIGO: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500', bar: 'bg-indigo-500' },
};
