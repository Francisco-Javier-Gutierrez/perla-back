import { Request, Response } from 'express';
import pool from '../config/database';
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const [destinosResult]: any = await pool.query('SELECT COUNT(*) as total FROM destinos');
        const [atractivosResult]: any = await pool.query('SELECT COUNT(*) as total FROM atractivos');
        const [usuariosResult]: any = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        const [resenasResult]: any = await pool.query('SELECT COUNT(*) as total FROM resenas');
        // Recent Activity: Last 5 Attractions created
        const [recentAttractions]: any = await pool.query(`
            SELECT id_atractivo, nombre, fecha_creacion
            FROM atractivos
            ORDER BY fecha_creacion DESC
            LIMIT 5
        `);
        // Simulated Chart Data (Reseñas por mes simuladas)
        const chartData = [
            { name: 'Ene', reseñas: 10 },
            { name: 'Feb', reseñas: 15 },
            { name: 'Mar', reseñas: 25 },
            { name: 'Abr', reseñas: 40 },
            { name: 'May', reseñas: 65 },
            { name: 'Jun', reseñas: 85 },
            { name: 'Jul', reseñas: resenasResult[0].total > 85 ? resenasResult[0].total : 110 },
        ];
        res.json({
            totalDestinos: destinosResult[0].total,
            totalAtractivos: atractivosResult[0].total,
            totalUsuarios: usuariosResult[0].total,
            totalResenas: resenasResult[0].total,
            recentAttractions,
            chartData
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error del servidor al cargar las estadísticas.' });
    }
};
