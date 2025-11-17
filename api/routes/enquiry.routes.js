import { Router } from 'express';
import { createEnquiry, getAllEnquiries, updateEnquiryStatus } from '../controllers/enquiry.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/").post(createEnquiry);
router.route("/").get(verifyJWT, getAllEnquiries);
router.route("/status/:id").patch(verifyJWT, updateEnquiryStatus);

export default router;