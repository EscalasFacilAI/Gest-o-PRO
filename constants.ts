import { User, Task, Team, normalizeDate } from './types';
import { format } from 'date-fns';

const today = normalizeDate(new Date());
const todayStr = format(today, 'yyyy-MM-dd');
const tomorrow = normalizeDate(new Date(today));
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = normalizeDate(new Date(today));
nextWeek.setDate(nextWeek.getDate() + 5);

export const INITIAL_TEAMS: Team[] = [
  { id: 'team_rh', name: 'Recursos Humanos', color: 'indigo' },
  { id: 'team_dp', name: 'Departamento Pessoal', color: 'blue' },
  { id: 'team_ti', name: 'Tecnologia', color: 'slate' },
];

export const USERS: User[] = [
  {
    id: 'u1',
    name: 'Vinicius Alves de Amurim',
    email: 'vinicius.amurim@empresa.com',
    role: 'COORDINATOR',
    teamId: 'team_rh',
    avatar: 'https://ui-avatars.com/api/?name=Vinicius+Amurim&background=4f46e5&color=fff',
    presencialDates: [todayStr],
  },
  {
    id: 'u2',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@empresa.com',
    role: 'LEADER',
    teamId: 'team_dp',
    avatar: 'https://picsum.photos/seed/carlos/200/200',
    presencialDates: [todayStr],
  },
  {
    id: 'u3',
    name: 'Beatriz Costa',
    email: 'bia.costa@empresa.com',
    role: 'MEMBER',
    teamId: 'team_dp',
    avatar: 'https://picsum.photos/seed/bia/200/200',
    presencialDates: [],
  },
  {
    id: 'u4',
    name: 'João Pereira',
    email: 'joao.pereira@empresa.com',
    role: 'MEMBER',
    teamId: 'team_rh',
    avatar: 'https://picsum.photos/seed/joao/200/200',
    presencialDates: [todayStr],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Reunião de Planejamento',
    description: 'Definir metas para o próximo trimestre.',
    assigneeId: 'u1',
    creatorId: 'u1',
    date: today,
    startTime: '09:00',
    endTime: '10:30',
    status: 'DONE',
    priority: 'HIGH',
  },
  {
    id: 't2',
    title: 'Fechamento da Folha',
    description: 'Conferir horas extras.',
    assigneeId: 'u2',
    creatorId: 'u1',
    date: today,
    startTime: '14:00',
    endTime: '16:00',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
  },
  {
    id: 't3',
    title: 'Cadastro de Benefícios',
    description: 'Atualizar VR e VT.',
    assigneeId: 'u3',
    creatorId: 'u1',
    date: today,
    startTime: '08:00',
    endTime: '12:00',
    status: 'TODO',
    priority: 'HIGH',
  },
  {
    id: 't4',
    title: 'Onboarding Novos',
    description: 'Preparar kits de boas vindas.',
    assigneeId: 'u4',
    creatorId: 'u1',
    date: nextWeek,
    startTime: '10:00',
    endTime: '11:00',
    status: 'TODO',
    priority: 'LOW',
  },
];

export const STATUS_LABELS: Record<string, string> = {
  TODO: 'Não Iniciado',
  IN_PROGRESS: 'Em Andamento',
  DONE: 'Concluído',
};

export const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  DONE: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200',
};