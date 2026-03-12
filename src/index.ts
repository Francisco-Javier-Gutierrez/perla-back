import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import atractivosRoutes from './routes/atractivosRoutes';
import categoriasRoutes from './routes/categoriasRoutes';
import resenasRoutes from './routes/resenasRoutes';
import destinosRoutes from './routes/destinosRoutes';
import usuariosRoutes from './routes/usuariosRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// CORS — permite peticiones desde el frontend en Vite (puerto 5173)
app.use(cors({
    origin: ['http://localhost:5173', 'https://d204ovax2om68f.cloudfront.net', 'https://localhost'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Servir archivos estáticos (uploads para imágenes locales)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
// Servir frontend (fallback estático)
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/destinos', destinosRoutes);
app.use('/api/atractivos', atractivosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API funcionando correctamente' });
});
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
