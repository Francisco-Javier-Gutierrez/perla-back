import { Request, Response } from 'express';
import pool from '../config/database';
export const getCategorias = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categorias');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
};
export const getCategoriaById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows]: any = await pool.query('SELECT * FROM categorias WHERE id_categoria = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener categoría' });
    }
};
export const createCategoria = async (req: Request, res: Response) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        const [result]: any = await pool.query(
            'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id_categoria: result.insertId, nombre, descripcion });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear categoría' });
    }
};
export const updateCategoria = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        const [result]: any = await pool.query(
            'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id_categoria = ?',
            [nombre, descripcion, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ message: 'Categoría actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
};
export const deleteCategoria = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result]: any = await pool.query('DELETE FROM categorias WHERE id_categoria = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ message: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
};
