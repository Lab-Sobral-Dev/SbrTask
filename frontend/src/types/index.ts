export interface User {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
  role: string;
  createdAt?: string;
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
  department: string | null;
  xp: number;
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
