import { Router } from 'express';
import { createApplication, getAllApplications, updateApplicationStatus } from '../controllers/application.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/").post(createApplication);
router.route("/").get(verifyJWT, getAllApplications);
router.route("/status/:id").patch(verifyJWT, updateApplicationStatus);

export default router;