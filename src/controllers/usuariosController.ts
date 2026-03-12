import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
// GET /api/usuarios/perfil — Obtener perfil del usuario autenticado
export const getPerfil = async (req: AuthRequest, res: Response) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });
        const [rows]: any = await pool.query(
            'SELECT id_usuario, nombre, correo, rol, fecha_registro FROM usuarios WHERE id_usuario = ?',
            [id_usuario]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Obtener conteo de reseñas del usuario
        const [resenasCount]: any = await pool.query(
            'SELECT COUNT(*) as total FROM resenas WHERE id_usuario = ?',
            [id_usuario]
        );
        const perfil = {
            ...rows[0],
            total_resenas: resenasCount[0].total
        };
        res.json(perfil);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};
// GET /api/usuarios — Listar todos los usuarios (admin)
export const getUsuarios = async (req: AuthRequest, res: Response) => {
    try {
        const [rows] = await pool.query(
            'SELECT id_usuario, nombre, correo, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};
// DELETE /api/usuarios/:id — Eliminar usuario (admin)
export const deleteUsuario = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        // No permitir que el admin se elimine a sí mismo
        if (req.usuario?.id_usuario === Number(id)) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        const [result]: any = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};
// PUT /api/usuarios/:id/rol — Cambiar rol del usuario (admin)
export const updateUsuarioRol = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;
        if (rol !== 'admin' && rol !== 'usuario') {
            return res.status(400).json({ error: 'Rol inválido' });
        }
        // No permitir que el admin se quite el rol a sí mismo, por seguridad
        if (req.usuario?.id_usuario === Number(id)) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }
        const [result]: any = await pool.query(
            'UPDATE usuarios SET rol = ? WHERE id_usuario = ?',
            [rol, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ message: 'Rol actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar rol de usuario' });
    }
};
