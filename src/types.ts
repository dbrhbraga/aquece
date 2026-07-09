export interface User {
  id: string;
  name: string;
  avatarColor: string;
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
}
