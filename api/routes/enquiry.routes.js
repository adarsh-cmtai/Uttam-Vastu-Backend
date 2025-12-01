import { Router } from 'express';
import { createEnquiry, getAllEnquiries, updateEnquiryStatus, deleteEnquiries, replyToEnquiry } from '../controllers/enquiry.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/").post(createEnquiry);
router.route("/").get(verifyJWT, getAllEnquiries);
router.route("/").delete(verifyJWT, deleteEnquiries);
router.route("/status/:id").patch(verifyJWT, updateEnquiryStatus);
router.route("/reply/:id").post(verifyJWT, replyToEnquiry);

export default router;