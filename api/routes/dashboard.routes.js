import { Router } from 'express';
import { getDashboardStats, downloadReport } from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/stats").get(verifyJWT, getDashboardStats);
router.route("/download").get(verifyJWT, downloadReport);

export default router;