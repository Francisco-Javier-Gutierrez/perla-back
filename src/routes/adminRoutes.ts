import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminController';
const router = Router();
// Endpoint for Dashboard metrics
router.get('/stats', getDashboardStats);
export default router;
