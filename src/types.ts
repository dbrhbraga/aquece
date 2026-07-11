export interface User {
  id: string;
  name: string;
  avatarColor: string;
  ownerId?: string;
  type?: 'grupo' | 'atleta';
  targetGoal?: string;
  weeklyVolumeTarget?: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  name: string;
  status: 'pending' | 'accepted';
  ownerId?: string;
  athleteId?: string;
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
  groupTrainingId?: string;
  parentGroupId?: string;
  baselinePlannedKm?: number;
}
