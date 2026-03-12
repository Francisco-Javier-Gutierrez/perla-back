import { Request, Response } from 'express';
import pool from '../config/database';
export const getAtractivos = async (req: Request, res: Response) => {
    try {
        const { id_destino, id_categoria } = req.query;
        let query = `
            SELECT a.*, c.nombre as categoria_nombre, d.nombre as destino_nombre
            FROM atractivos a
            LEFT JOIN categorias c ON a.id_categoria = c.id_categoria
            LEFT JOIN destinos d ON a.id_destino = d.id_destino
            WHERE a.activo = true
        `;
        const params: any[] = [];
        if (id_destino) {
            query += ' AND a.id_destino = ?';
            params.push(id_destino);
        }
        if (id_categoria) {
            query += ' AND a.id_categoria = ?';
            params.push(id_categoria);
        }
        query += ' ORDER BY a.id_atractivo DESC';
        const [rows]: any = await pool.query(query, params);
        const imageBaseUrl = `http://localhost:5000/uploads/`;
        for (const r of rows) {
            if (r.imagen_url && !r.imagen_url.startsWith('http')) {
                r.imagen_url = `${imageBaseUrl}${r.imagen_url}`;
            }
        }
        res.json(rows);
    } catch (error) {
        console.error('Error en getAtractivos:', error);
        res.status(500).json({ error: 'Error al obtener atractivos' });
    }
};
export const getAtractivoCompleto = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // 1. Obtener datos base con destino y categoría
        const [atractivoRows]: any = await pool.query(`
            SELECT a.*, c.nombre as categoria_nombre, d.nombre as destino_nombre, d.id_destino
            FROM atractivos a
            LEFT JOIN categorias c ON a.id_categoria = c.id_categoria
            LEFT JOIN destinos d ON a.id_destino = d.id_destino
            WHERE a.id_atractivo = ?
        `, [id]);
        if (atractivoRows.length === 0) {
            return res.status(404).json({ error: 'Atractivo no encontrado' });
        }
        const atractivo = atractivoRows[0];
        const imageBaseUrl = `http://localhost:5000/uploads/`;
        if (atractivo.imagen_url && !atractivo.imagen_url.startsWith('http')) {
            atractivo.imagen_url = `${imageBaseUrl}${atractivo.imagen_url}`;
        }
        // 2. Obtener fotos
        const [fotosRows]: any = await pool.query(
            'SELECT * FROM fotos_atractivo WHERE id_atractivo = ? ORDER BY orden ASC', [id]
        );
        atractivo.fotos = fotosRows;
        // 3. Obtener ubicación
        const [ubicacionRows]: any = await pool.query(
            'SELECT * FROM ubicaciones WHERE id_atractivo = ?', [id]
        );
        atractivo.ubicacion = ubicacionRows.length > 0 ? ubicacionRows[0] : null;
        // 4. Obtener datos_destino (relacionados al destino padre)
        if (atractivo.id_destino) {
            const [datosRows]: any = await pool.query(
                'SELECT * FROM datos_destino WHERE id_destino = ?', [atractivo.id_destino]
            );
            atractivo.datos_destino = datosRows.length > 0 ? datosRows[0] : null;
        } else {
            atractivo.datos_destino = null;
        }
        // 5. Obtener promedio de calificaciones
        // (el frontend usa 'promedio_calificacion', así que lo devolvemos con ese nombre)
        const [promedioRow]: any = await pool.query(
            'SELECT AVG(calificacion) as promedio, COUNT(*) as total FROM resenas WHERE id_atractivo = ?', [id]
        );
        atractivo.promedio_calificacion = promedioRow[0].promedio ? Number(promedioRow[0].promedio).toFixed(1) : null;
        atractivo.calificacion_promedio = atractivo.promedio_calificacion; // alias para compatibilidad
        atractivo.total_resenas = promedioRow[0].total || 0;
        // 6. Obtener las últimas reseñas
        // (el frontend usa 'usuario_nombre', así que usamos ese alias)
        const [resenas]: any = await pool.query(`
            SELECT r.*, u.nombre as usuario_nombre, u.nombre as nombre_usuario
            FROM resenas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            WHERE r.id_atractivo = ?
            ORDER BY r.fecha DESC
            LIMIT 10
        `, [id]);
        atractivo.resenas = resenas;

        res.json(atractivo);
    } catch (error) {
        console.error('Error en getAtractivoCompleto:', error);
        res.status(500).json({ error: 'Error al obtener detalles del atractivo' });
    }
};
export const createAtractivo = async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            nombre,
            descripcion_corta,
            descripcion_detallada,
            id_destino,
            id_categoria,
            activo,
            ubicacion,
            fotos
        } = req.body;
        if (!nombre || !descripcion_corta || !descripcion_detallada) {
            return res.status(400).json({ error: 'Nombre, descripción corta y descripción detallada son obligatorios' });
        }
        // 1. Insertar atractivo
        const [resultAt]: any = await conn.query(
            `INSERT INTO atractivos 
            (nombre, descripcion_corta, descripcion_detallada, id_destino, id_categoria, activo) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion_corta, descripcion_detallada, id_destino, id_categoria, activo ?? true]
        );
        const id_atractivo = resultAt.insertId;
        // 2. Insertar Ubicación
        if (ubicacion) {
            await conn.query(
                'INSERT INTO ubicaciones (id_atractivo, latitud, longitud) VALUES (?, ?, ?)',
                [id_atractivo, ubicacion.latitud, ubicacion.longitud]
            );
        }
        // 3. Insertar Fotos
        if (fotos && Array.isArray(fotos)) {
            for (const foto of fotos) {
                await conn.query(
                    'INSERT INTO fotos_atractivo (id_atractivo, url_imagen, descripcion_imagen, orden) VALUES (?, ?, ?, ?)',
                    [id_atractivo, foto.url_imagen, foto.descripcion_imagen, foto.orden || 0]
                );
            }
        }
        await conn.commit();
        res.status(201).json({ message: 'Atractivo creado exitosamente', id_atractivo });
    } catch (error) {
        await conn.rollback();
        console.error('Error en createAtractivo:', error);
        res.status(500).json({ error: 'Error al crear atractivo' });
    } finally {
        conn.release();
    }
};
export const updateAtractivo = async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const {
            nombre, descripcion_corta, descripcion_detallada, id_destino, id_categoria, activo,
            ubicacion, fotos
        } = req.body;
        const [result]: any = await conn.query(
            `UPDATE atractivos 
             SET nombre=?, descripcion_corta=?, descripcion_detallada=?, id_destino=?, id_categoria=?, activo=? 
             WHERE id_atractivo=?`,
            [nombre, descripcion_corta, descripcion_detallada, id_destino, id_categoria, activo, id]
        );
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Atractivo no encontrado' });
        }
        if (ubicacion) {
            await conn.query(
                `INSERT INTO ubicaciones (id_atractivo, latitud, longitud) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE latitud=VALUES(latitud), longitud=VALUES(longitud)`,
                [id, ubicacion.latitud, ubicacion.longitud]
            );
        }
        if (fotos) {
            await conn.query('DELETE FROM fotos_atractivo WHERE id_atractivo=?', [id]);
            for (const foto of fotos) {
                await conn.query(
                    'INSERT INTO fotos_atractivo (id_atractivo, url_imagen, descripcion_imagen, orden) VALUES (?, ?, ?, ?)',
                    [id, foto.url_imagen, foto.descripcion_imagen, foto.orden || 0]
                );
            }
        }
        await conn.commit();
        res.json({ message: 'Atractivo actualizado exitosamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error en updateAtractivo:', error);
        res.status(500).json({ error: 'Error al actualizar atractivo' });
    } finally {
        conn.release();
    }
};
export const deleteAtractivo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result]: any = await pool.query('DELETE FROM atractivos WHERE id_atractivo = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Atractivo no encontrado' });
        }
        res.json({ message: 'Atractivo eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteAtractivo:', error);
        res.status(500).json({ error: 'Error al eliminar atractivo' });
    }
};
