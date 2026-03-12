import { Request, Response } from 'express';
import pool from '../config/database';
// GET /api/destinos — Lista todos los destinos con sus categorías y conteo de atractivos
export const getDestinos = async (req: Request, res: Response) => {
    try {
        // Obtener destinos base
        const [destinos]: any = await pool.query(`
            SELECT d.*
            FROM destinos d
            WHERE d.activo = true
            ORDER BY d.fecha_creacion DESC
        `);
        const imageBaseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://api.franciscojgh.com/uploads/' 
            : 'http://localhost:5000/uploads/';
        for (const destino of destinos) {
            // Formatear imagen portada del destino
            if (destino.imagen_portada && !destino.imagen_portada.startsWith('http')) {
                destino.imagen_portada = `${imageBaseUrl}${destino.imagen_portada}`;
            }
            // Categorías como array de objetos
            const [categorias]: any = await pool.query(`
                SELECT c.id_categoria, c.nombre
                FROM categorias c
                JOIN destino_categoria dc ON c.id_categoria = dc.id_categoria
                WHERE dc.id_destino = ?
            `, [destino.id_destino]);
            destino.categorias = categorias;
            // Obtener atractivos del destino con fotos, ubicación y calificación (Misma estructura que getDestinoById)
            const [atractivos]: any = await pool.query(`
                SELECT a.*, c.nombre as categoria_nombre
                FROM atractivos a
                LEFT JOIN categorias c ON a.id_categoria = c.id_categoria
                WHERE a.id_destino = ? AND a.activo = true
                ORDER BY a.id_atractivo ASC
            `, [destino.id_destino]);
            const mappedAtractivos = [];
            for (const atractivo of atractivos) {
                let imagen_url = null;
                if (atractivo.imagen_url) {
                    imagen_url = atractivo.imagen_url.startsWith('http') ? atractivo.imagen_url : `${imageBaseUrl}${atractivo.imagen_url}`;
                } else {
                    // Fallback to fotos_atractivo legacy logic
                    const [fotos]: any = await pool.query('SELECT url_imagen FROM fotos_atractivo WHERE id_atractivo = ? ORDER BY orden ASC LIMIT 1', [atractivo.id_atractivo]);
                    if (fotos.length > 0 && fotos[0].url_imagen) {
                        imagen_url = fotos[0].url_imagen.startsWith('http') ? fotos[0].url_imagen : `${imageBaseUrl}${fotos[0].url_imagen}`;
                    }
                }
                const [ubicacionRows]: any = await pool.query('SELECT latitud, longitud FROM ubicaciones WHERE id_atractivo = ?', [atractivo.id_atractivo]);
                const ubicacion = ubicacionRows.length > 0 ? ubicacionRows[0] : null;
                mappedAtractivos.push({
                    id: atractivo.id_atractivo,
                    nombre: atractivo.nombre,
                    descripcion: atractivo.descripcion_corta || atractivo.descripcion_detallada,
                    imagen_url,
                    horario: atractivo.horario,
                    costo: atractivo.costo,
                    telefono: atractivo.telefono,
                    ubicacion
                });
            }
            destino.atractivos = mappedAtractivos;
            destino.total_atractivos = mappedAtractivos.length;
            // Promedio de calificación (a través de sus atractivos)
            const [promedio]: any = await pool.query(`
                SELECT AVG(r.calificacion) as promedio, COUNT(r.id_resena) as total_resenas
                FROM resenas r
                JOIN atractivos a ON r.id_atractivo = a.id_atractivo
                WHERE a.id_destino = ?
            `, [destino.id_destino]);
            destino.calificacion_promedio = promedio[0].promedio ? Number(promedio[0].promedio).toFixed(1) : null;
            destino.total_resenas = promedio[0].total_resenas || 0;
        }
        res.json(destinos);
    } catch (error) {
        console.error('Error en getDestinos:', error);
        res.status(500).json({ error: 'Error al obtener destinos' });
    }
};
// GET /api/destinos/admin/todos — Lista TODOS los destinos sin filtrar activos (para Admin)
export const getAllDestinos = async (req: Request, res: Response) => {
    try {
        const [destinos]: any = await pool.query(`
            SELECT d.*
            FROM destinos d
            ORDER BY d.fecha_creacion DESC
        `);
        res.json(destinos);
    } catch (error) {
        console.error('Error en getAllDestinos:', error);
        res.status(500).json({ error: 'Error al obtener todos los destinos para admin' });
    }
};
// GET /api/destinos/:id — Detalle completo de un destino
export const getDestinoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // 1. Obtener destino
        const [destinoRows]: any = await pool.query('SELECT * FROM destinos WHERE id_destino = ?', [id]);
        if (destinoRows.length === 0) {
            return res.status(404).json({ error: 'Destino no encontrado' });
        }
        const destino = destinoRows[0];
        const imageBaseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://api.franciscojgh.com/uploads/' 
            : 'http://localhost:5000/uploads/';
        // Formatear imagen portada
        if (destino.imagen_portada && !destino.imagen_portada.startsWith('http')) {
            destino.imagen_portada = `${imageBaseUrl}${destino.imagen_portada}`;
        }
        // 2. Obtener categorías del destino (array de objetos)
        const [categorias]: any = await pool.query(`
            SELECT c.id_categoria, c.nombre, c.descripcion
            FROM categorias c
            JOIN destino_categoria dc ON c.id_categoria = dc.id_categoria
            WHERE dc.id_destino = ?
        `, [id]);
        destino.categorias = categorias;
        // 3. Obtener datos_destino
        const [datosRows]: any = await pool.query('SELECT * FROM datos_destino WHERE id_destino = ?', [id]);
        destino.datos_destino = datosRows.length > 0 ? datosRows[0] : null;
        // 4. Obtener atractivos del destino con fotos, ubicación y calificación
        const [atractivos]: any = await pool.query(`
            SELECT a.*, c.nombre as categoria_nombre
            FROM atractivos a
            LEFT JOIN categorias c ON a.id_categoria = c.id_categoria
            WHERE a.id_destino = ? AND a.activo = true
            ORDER BY a.id_atractivo ASC
            LIMIT 4
        `, [id]);
        const mappedAtractivos = [];
        for (const atractivo of atractivos) {
            let imagen_url = null;
            if (atractivo.imagen_url) {
                imagen_url = atractivo.imagen_url.startsWith('http') ? atractivo.imagen_url : `${imageBaseUrl}${atractivo.imagen_url}`;
            } else {
                const [fotos]: any = await pool.query('SELECT url_imagen FROM fotos_atractivo WHERE id_atractivo = ? ORDER BY orden ASC LIMIT 1', [atractivo.id_atractivo]);
                if (fotos.length > 0 && fotos[0].url_imagen) {
                    imagen_url = fotos[0].url_imagen.startsWith('http') ? fotos[0].url_imagen : `${imageBaseUrl}${fotos[0].url_imagen}`;
                }
            }
            const [ubicacionRows]: any = await pool.query('SELECT latitud, longitud FROM ubicaciones WHERE id_atractivo = ?', [atractivo.id_atractivo]);
            const ubicacion = ubicacionRows.length > 0 ? ubicacionRows[0] : null;
            mappedAtractivos.push({
                id: atractivo.id_atractivo,
                nombre: atractivo.nombre,
                descripcion: atractivo.descripcion_corta || atractivo.descripcion_detallada,
                imagen_url,
                horario: atractivo.horario,
                costo: atractivo.costo,
                telefono: atractivo.telefono,
                ubicacion
            });
        }
        destino.atractivos = mappedAtractivos;
        // 5. Calificación promedio general del destino y reseñas
        const [promedioGeneral]: any = await pool.query(`
            SELECT AVG(r.calificacion) as promedio, COUNT(r.id_resena) as total
            FROM resenas r
            JOIN atractivos a ON r.id_atractivo = a.id_atractivo
            WHERE a.id_destino = ?
        `, [id]);
        destino.calificacion_promedio = promedioGeneral[0].promedio ? Number(promedioGeneral[0].promedio).toFixed(1) : null;
        destino.total_resenas = promedioGeneral[0].total || 0;
        // Obtener historial de reseñas
        const [resenas]: any = await pool.query(`
            SELECT r.id_resena, r.calificacion, r.comentario, r.fecha, u.nombre as usuario_nombre, a.nombre as atractivo_nombre
            FROM resenas r
            JOIN usuarios u ON r.id_usuario = u.id_usuario
            JOIN atractivos a ON r.id_atractivo = a.id_atractivo
            WHERE a.id_destino = ?
            ORDER BY r.fecha DESC
        `, [id]);
        destino.resenas = resenas;
        res.json(destino);
    } catch (error) {
        console.error('Error en getDestinoById:', error);
        res.status(500).json({ error: 'Error al obtener destino' });
    }
};
// POST /api/destinos — Crear destino (admin)
export const createDestino = async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { nombre, descripcion, imagen_portada, categorias, datos_destino } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        // 1. Insertar destino
        const [result]: any = await conn.query(
            'INSERT INTO destinos (nombre, descripcion, imagen_portada) VALUES (?, ?, ?)',
            [nombre, descripcion, imagen_portada]
        );
        const id_destino = result.insertId;
        // 2. Insertar relaciones con categorías
        if (categorias && Array.isArray(categorias)) {
            for (const id_categoria of categorias) {
                await conn.query(
                    'INSERT INTO destino_categoria (id_destino, id_categoria) VALUES (?, ?)',
                    [id_destino, id_categoria]
                );
            }
        }
        // 3. Insertar datos_destino
        if (datos_destino) {
            await conn.query(
                `INSERT INTO datos_destino (id_destino, horario, precio, telefono, direccion, recomendaciones) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id_destino, datos_destino.horario, datos_destino.precio, datos_destino.telefono, datos_destino.direccion, datos_destino.recomendaciones]
            );
        }
        await conn.commit();
        res.status(201).json({ message: 'Destino creado exitosamente', id_destino });
    } catch (error) {
        await conn.rollback();
        console.error('Error en createDestino:', error);
        res.status(500).json({ error: 'Error al crear destino' });
    } finally {
        conn.release();
    }
};
// PUT /api/destinos/:id — Actualizar destino (admin)
export const updateDestino = async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;
        const { nombre, descripcion, imagen_portada, activo, categorias, datos_destino } = req.body;
        // 1. Actualizar destino
        const [result]: any = await conn.query(
            'UPDATE destinos SET nombre=?, descripcion=?, imagen_portada=?, activo=? WHERE id_destino=?',
            [nombre, descripcion, imagen_portada, activo ?? true, id]
        );
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Destino no encontrado' });
        }
        // 2. Actualizar categorías (eliminar y reinsertar)
        if (categorias && Array.isArray(categorias)) {
            await conn.query('DELETE FROM destino_categoria WHERE id_destino = ?', [id]);
            for (const id_categoria of categorias) {
                await conn.query(
                    'INSERT INTO destino_categoria (id_destino, id_categoria) VALUES (?, ?)',
                    [id, id_categoria]
                );
            }
        }
        // 3. Actualizar datos_destino
        if (datos_destino) {
            await conn.query(
                `INSERT INTO datos_destino (id_destino, horario, precio, telefono, direccion, recomendaciones)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 horario=VALUES(horario), precio=VALUES(precio), telefono=VALUES(telefono),
                 direccion=VALUES(direccion), recomendaciones=VALUES(recomendaciones)`,
                [id, datos_destino.horario, datos_destino.precio, datos_destino.telefono, datos_destino.direccion, datos_destino.recomendaciones]
            );
        }
        await conn.commit();
        res.json({ message: 'Destino actualizado exitosamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error en updateDestino:', error);
        res.status(500).json({ error: 'Error al actualizar destino' });
    } finally {
        conn.release();
    }
};
// DELETE /api/destinos/:id — Eliminar destino (admin)
export const deleteDestino = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result]: any = await pool.query('DELETE FROM destinos WHERE id_destino = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Destino no encontrado' });
        }
        res.json({ message: 'Destino eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteDestino:', error);
        res.status(500).json({ error: 'Error al eliminar destino' });
    }
};
