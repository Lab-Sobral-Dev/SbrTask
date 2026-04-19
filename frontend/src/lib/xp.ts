// XP needed to go from level N to level N+1
export const xpForLevel = (level: number): number =>
  Math.floor(100 * Math.pow(level, 1.5));

// Cumulative XP required to reach level N (starting from level 1)
export const totalXpForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
};

// XP progress within the current level
export const xpLevelProgress = (
  xp: number,
  level: number,
): { progress: number; needed: number; pct: number } => {
  const base = totalXpForLevel(level);
  const needed = xpForLevel(level);
  const progress = Math.max(0, xp - base);
  return { progress, needed, pct: Math.min((progress / needed) * 100, 100) };
};
