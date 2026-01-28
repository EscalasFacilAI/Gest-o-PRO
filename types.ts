
export type Role = 'COORDINATOR' | 'LEADER' | 'MEMBER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type AlertColor = 'RED' | 'ORANGE' | 'BLUE' | 'PURPLE' | 'GREEN';

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

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  targetTeamId?: string; // Optional: If specific to a team context
  date: Date; // Normalized to midnight
  startTime?: string; // Format "HH:mm"
  endTime?: string;   // Format "HH:mm"
  status: TaskStatus;
  priority: Priority;
  isNudged?: boolean; // If true, it was "Cobrada"
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
export const ALERT_COLOR_MAP: Record<AlertColor, { bg: string, border: string, text: string, icon: string }> = {
  RED: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
  ORANGE: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
  BLUE: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
  PURPLE: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' },
  GREEN: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
};
