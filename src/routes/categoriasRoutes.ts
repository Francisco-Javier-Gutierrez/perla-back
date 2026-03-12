import { Router } from 'express';
import { getCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria } from '../controllers/categoriasController';
import { verificarToken, esAdmin } from '../middlewares/auth';
const router = Router();
// Públicas
router.get('/', getCategorias);
router.get('/:id', getCategoriaById);
// Protegidas (Solo Admin)
router.post('/', verificarToken, esAdmin, createCategoria);
router.put('/:id', verificarToken, esAdmin, updateCategoria);
router.delete('/:id', verificarToken, esAdmin, deleteCategoria);
export default router;
