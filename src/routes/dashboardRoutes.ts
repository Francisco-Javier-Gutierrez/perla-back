import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
const router = Router();
// Endpoint for Dashboard Stats (Protected theoretically, assuming frontend calls it from /admin)
router.get('/stats', getDashboardStats);
export default router;
