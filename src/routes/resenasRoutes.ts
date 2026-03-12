import { Router } from 'express';
import { getResenasByAtractivo, createResena, deleteResena, getTodasResenas } from '../controllers/resenasController';
import { verificarToken, esAdmin } from '../middlewares/auth';
const router = Router();
// Obtener todas las reseñas (Admin)
router.get('/todas', verificarToken, esAdmin, getTodasResenas);
// Obtener reseñas por atractivo
router.get('/atractivo/:id_atractivo', getResenasByAtractivo);
// Crear reseña (usuario logueado)
router.post('/', verificarToken, createResena);
// Eliminar reseña (usuario logueado o admin)
router.delete('/:id', verificarToken, deleteResena);
export default router;
