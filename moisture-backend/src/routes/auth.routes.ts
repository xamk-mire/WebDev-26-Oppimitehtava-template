import { Router } from 'express';
import { postLogin, postRegister } from '../controllers/auth.controller';
const r = Router();
r.post('/register', postRegister);
r.post('/login', postLogin);
export default r;
