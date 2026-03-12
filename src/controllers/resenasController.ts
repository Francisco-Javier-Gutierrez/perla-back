import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getResenasByAtractivo = async (req: Request, res: Response) => {
    try {
        const { id_atractivo } = req.params;
        const query = `
            SELECT r.*, u.nombre as nombre_usuario 
            FROM resenas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.id_atractivo = ?
            ORDER BY r.fecha DESC
        `;
        const [rows] = await pool.query(query, [id_atractivo]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener reseñas' });
    }
};
// Obtener TODAS las reseñas (para Admin)
export const getTodasResenas = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT r.*, u.nombre as nombre_usuario, a.nombre as nombre_atractivo, d.nombre as nombre_destino
            FROM resenas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            JOIN atractivos a ON r.id_atractivo = a.id_atractivo
            JOIN destinos d ON a.id_destino = d.id_destino
            ORDER BY r.fecha DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener todas las reseñas' });
    }
};
export const createResena = async (req: AuthRequest, res: Response) => {
    try {
        const { id_atractivo, calificacion, comentario } = req.body;
        const id_usuario = req.usuario?.id_usuario;
        if (!id_usuario) return res.status(401).json({ error: 'Usuario no autenticado' });
        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
        }

        if (comentario && comentario.trim() !== '') {
            try {
                const prompt = `Evalúa la siguiente reseña turística. Si contiene insultos, groserías, spam, contenido ofensivo o es completamente inapropiada, responde sólo con la palabra "RECHAZADA". De lo contrario, responde sólo con la palabra "APROBADA". Reseña: "${comentario}"`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                
                const aiResult = response.text?.trim().toUpperCase() || '';
                if (aiResult.includes('RECHAZADA')) {
                    return res.status(400).json({ error: 'La reseña contiene lenguaje inapropiado y no fue aprobada por nuestras políticas de contenido' });
                }
            } catch (aiError) {
                console.error("Error al validar reseña con Gemini:", aiError);
                // Si la API falla, podemos optar por rechazar o aceptar, aquí lo pasamos pero logueamos
            }
        }

        const [result]: any = await pool.query(
            'INSERT INTO resenas (id_usuario, id_atractivo, calificacion, comentario) VALUES (?, ?, ?, ?)',
            [id_usuario, id_atractivo, calificacion, comentario]
        );
        res.status(201).json({ message: 'Reseña creada', id_resena: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear reseña' });
    }
};
export const deleteResena = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario?.id_usuario;
        const rol = req.usuario?.rol;
        if (!id_usuario) return res.status(401).json({ error: 'Usuario no autenticado' });
        // Administrador puede eliminar cualquiera. Usuario normal solo la suya.
        let query = 'DELETE FROM resenas WHERE id_resena = ?';
        let params: any[] = [id];
        if (rol !== 'admin') {
            query += ' AND id_usuario = ?';
            params.push(id_usuario);
        }
        const [result]: any = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(403).json({ error: 'No autorizado o reseña no encontrada' });
        }
        res.json({ message: 'Reseña eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar reseña' });
    }
};
