import { Router } from 'express';
import { 
    registerUser, 
    verifyOTP,
    resendVerificationOTP,
    loginUser,
    forgotPassword,
    resetPassword,
    logoutUser,
    getCurrentUser 
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(registerUser);
router.route("/verify-otp").post(verifyOTP);
router.route("/resend-otp").post(resendVerificationOTP);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;