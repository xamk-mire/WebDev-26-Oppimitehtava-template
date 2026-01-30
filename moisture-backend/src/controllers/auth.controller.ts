import { Request, Response } from 'express';
import { login, register } from '../services/auth.service';

export async function postRegister(req: Request, res: Response) {
  const { email, password, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });
  try {
    const u = await register(email, password, name);
    res.status(201).json(u);
  } catch (e: any) {
    if (e.message === 'User exists')
      return res.status(409).json({ error: e.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postLogin(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });
  try {
    const resp = await login(email, password);
    res.json(resp);
  } catch (e: any) {
    if (e.message === 'Invalid credentials')
      return res.status(401).json({ error: e.message });
    res.status(500).json({ error: 'Internal server error' });
  }
}
