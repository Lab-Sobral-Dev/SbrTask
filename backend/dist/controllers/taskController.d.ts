import { Request, Response } from 'express';
export declare const createTask: (req: Request, res: Response) => Promise<void>;
export declare const getTasks: (req: Request, res: Response) => Promise<void>;
export declare const getTaskById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=taskController.d.ts.map