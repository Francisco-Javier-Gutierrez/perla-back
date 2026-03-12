import { Router } from 'express';
import { getAtractivos, getAtractivoCompleto, createAtractivo, updateAtractivo, deleteAtractivo } from '../controllers/atractivosController';
import { verificarToken, esAdmin } from '../middlewares/auth';
const router = Router();
// Públicas
router.get('/', getAtractivos);
router.get('/:id', getAtractivoCompleto);
// Protegidas (Solo Admin)
router.post('/', verificarToken, esAdmin, createAtractivo);
router.put('/:id', verificarToken, esAdmin, updateAtractivo);
router.delete('/:id', verificarToken, esAdmin, deleteAtractivo);
export default router;
