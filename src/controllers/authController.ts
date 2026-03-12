import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
export const register = async (req: Request, res: Response) => {
    try {
        const { nombre, correo, contrasena, rol } = req.body;
        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
        }
        // Check if user exists
        const [existingUsers]: any = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);
        // Define role
        const userRol = rol === 'admin' ? 'admin' : 'usuario';
        // Insert user
        const [result]: any = await pool.query(
            'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
            [nombre, correo, hashedPassword, userRol]
        );
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            usuarioId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};
export const login = async (req: Request, res: Response) => {
    try {
        const { correo, contrasena } = req.body;
        if (!correo || !contrasena) {
            return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
        }
        // Find user
        const [users]: any = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const usuario = users[0];
        // Check password
        const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Generate token
        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};
