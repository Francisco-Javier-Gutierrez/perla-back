import { Request, Response } from 'express';
import pool from '../config/database';
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const connection = await pool.getConnection();
        // 1. Total Destinos
        const [destinosResult]: any = await connection.query('SELECT COUNT(*) as total FROM destinos');
        const totalDestinos = destinosResult[0].total;
        // 2. Total Atractivos
        const [atractivosResult]: any = await connection.query('SELECT COUNT(*) as total FROM atractivos');
        const totalAtractivos = atractivosResult[0].total;
        // 3. Total Usuarios
        const [usuariosResult]: any = await connection.query('SELECT COUNT(*) as total FROM usuarios');
        const totalUsuarios = usuariosResult[0].total;
        // 4. Total Reseñas
        const [resenasResult]: any = await connection.query('SELECT COUNT(*) as total FROM resenas');
        const totalResenas = resenasResult[0].total;
        // 5. Últimos 5 atractivos
        const [recentAttractions]: any = await connection.query(`
            SELECT id_atractivo, nombre, NOW() as fecha_creacion
            FROM atractivos
            ORDER BY id_atractivo DESC
            LIMIT 5
        `);
        connection.release();
        res.json({
            totalDestinos,
            totalAtractivos,
            totalUsuarios,
            totalResenas,
            recentAttractions,
            // Example chart data structure that the frontend expects
            chartData: [
                { name: 'Ene', reseñas: Math.floor(totalResenas * 0.1) },
                { name: 'Feb', reseñas: Math.floor(totalResenas * 0.15) },
                { name: 'Mar', reseñas: Math.floor(totalResenas * 0.2) },
                { name: 'Abr', reseñas: Math.floor(totalResenas * 0.1) },
                { name: 'May', reseñas: Math.floor(totalResenas * 0.45) }
            ]
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas.' });
    }
};
