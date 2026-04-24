import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import config from '../config';
import { ldapBindUser, ldapSearchUser } from '../services/ldap';
import { AuthRequest } from '../middlewares/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    // 1. Validate credentials via LDAP bind
    const isValid = await ldapBindUser(username, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // 2. Fetch user attributes from AD
    const adUser = await ldapSearchUser(username);
    if (!adUser) {
      return res.status(401).json({ error: 'Usuário não encontrado no diretório' });
    }

    const email = adUser.mail || null;

    // 3. Upsert user in DB
    let user = await prisma.user.findUnique({ where: { adUsername: adUser.sAMAccountName } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          adUsername:  adUser.sAMAccountName,
          email,
          name:        adUser.displayName,
          department:  adUser.departmentSlug,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { name: adUser.displayName, email, lastLoginAt: new Date() },
      });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Conta desativada. Contate o TI.' });
    }

    // 4. Remote access check
    const clientIp = req.ip ?? '';
    const isCompanyNetwork =
      config.companyIps.length === 0 || config.companyIps.includes(clientIp);

    if (!isCompanyNetwork) {
      const isTI = user.department === 'ti';
      if (!isTI && !user.allowRemoteAccess) {
        return res.status(403).json({
          error: 'Acesso externo não autorizado. Utilize a rede da empresa.',
        });
      }
    }

    // 5. Issue JWT (8h — shift duration)
    const token = jwt.sign(
      {
        sub:        user.id,
        name:       user.name,
        email:      user.email,
        department: user.department ?? 'unknown',
        role:       user.role,
      },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        department: user.department,
        role:       user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro ao autenticar' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where:  { id: authReq.userId! },
      select: { id: true, name: true, email: true, department: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const userList = await prisma.user.findMany({
      select: { id: true, adUsername: true, name: true, email: true, department: true, role: true, active: true, lastLoginAt: true },
      orderBy: { name: 'asc' },
    });
    return res.json(userList);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { role, active } = req.body as { role?: string; active?: boolean };

    const allowed = { role: ['admin', 'dept_user'], active: [true, false] };
    if (role !== undefined && !allowed.role.includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return res.json({ id: updated.id, role: updated.role, active: updated.active });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};
