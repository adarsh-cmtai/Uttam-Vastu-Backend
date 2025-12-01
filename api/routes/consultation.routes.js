import { Router } from 'express';
import { createConsultationRequest, getAllConsultationRequests, replyToConsultation, deleteConsultations } from '../controllers/consultation.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/request").post(createConsultationRequest);
router.route("/requests").get(verifyJWT, getAllConsultationRequests);
router.route("/requests").delete(verifyJWT, deleteConsultations);
router.route("/reply/:requestId").post(verifyJWT, replyToConsultation);

export default router;