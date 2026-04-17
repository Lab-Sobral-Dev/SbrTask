import { Request, Response } from 'express';
export declare const seedAchievements: () => Promise<void>;
export declare const getAchievements: (req: Request, res: Response) => Promise<void>;
export declare const getLeaderboard: (req: Request, res: Response) => Promise<void>;
export declare const checkAchievements: (userId: string) => Promise<string[]>;
//# sourceMappingURL=achievementController.d.ts.map