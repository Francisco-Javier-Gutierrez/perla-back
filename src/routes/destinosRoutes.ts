import { Router } from 'express';
import { getDestinos, getDestinoById, createDestino, updateDestino, deleteDestino, getAllDestinos } from '../controllers/destinosController';
import { verificarToken, esAdmin } from '../middlewares/auth';
const router = Router();
// Públicas
router.get('/', getDestinos);
// Admin (Debe ir antes de /:id para evitar choques)
router.get('/admin/todos', verificarToken, esAdmin, getAllDestinos);
router.get('/:id', getDestinoById);
// Protegidas (Solo Admin)
router.post('/', verificarToken, esAdmin, createDestino);
router.put('/:id', verificarToken, esAdmin, updateDestino);
router.delete('/:id', verificarToken, esAdmin, deleteDestino);
export default router;
