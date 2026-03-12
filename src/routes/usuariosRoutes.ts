import { Router } from 'express';
import { getPerfil, getUsuarios, deleteUsuario, updateUsuarioRol } from '../controllers/usuariosController';
import { verificarToken, esAdmin } from '../middlewares/auth';
const router = Router();
// Perfil del usuario autenticado
router.get('/perfil', verificarToken, getPerfil);
// Admin: listar, eliminar usuarios y cambiar rol
router.get('/', verificarToken, esAdmin, getUsuarios);
router.delete('/:id', verificarToken, esAdmin, deleteUsuario);
router.put('/:id/rol', verificarToken, esAdmin, updateUsuarioRol);
export default router;
