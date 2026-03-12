import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface AuthRequest extends Request {
    usuario?: {
        id_usuario: number;
        rol: string;
    };
}
export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
        const payload = jwt.verify(token, secret) as any;
        req.usuario = {
            id_usuario: payload.id_usuario,
            rol: payload.rol
        };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};
export const esAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};
