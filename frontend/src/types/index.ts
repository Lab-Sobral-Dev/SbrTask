export interface User {
  id: string;
  email: string;
  name: string;
  sector: string;
  role: string;
  level: number;
  xp: number;
  avatar: AvatarData;
  createdAt: string;
}

export interface AvatarData {
  skinColor: string;
  hair: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  beard: string | null;
  clothing: string;
  clothingColor: string;
  accessories: string[];
  backgroundColor: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'simple' | 'medium' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  category?: string;
  xpReward: number;
  completedAt?: string;
  userId: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'daily' | 'weekly' | 'milestone';
  xpReward: number;
  achieved: boolean;
  achievedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  sector: string;
  level: number;
  xp: number;
  avatar: AvatarData;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  byPriority: {
    simple: number;
    medium: number;
    critical: number;
  };
  recentCompleted: number;
  totalXPFromTasks: number;
}

export interface XPProgress {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  xpNeeded: number;
}
