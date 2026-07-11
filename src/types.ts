export interface User {
  id: string;
  name: string;
  avatarColor: string;
  ownerId?: string;
  type?: 'grupo' | 'atleta';
  targetGoal?: string;
  weeklyVolumeTarget?: number;
}

export interface Training {
  id: string;
  userId: string;
  week: number;
  description: string;
  dayOfWeek: string;
  plannedKm: number;
  completedKm: number;
  done: boolean;
  notes?: string;
  ownerId?: string;
}
