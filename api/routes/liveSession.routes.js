import { Router } from 'express';
import { createBooking, getAllBookings, updateBookingStatus } from '../controllers/liveSession.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/").post(createBooking);
router.route("/").get(verifyJWT, getAllBookings);
router.route("/status/:id").patch(verifyJWT, updateBookingStatus);

export default router;