import { Router } from 'express';
import authRouter from './auth.routes.js';
import consultationRouter from './consultation.routes.js';
import applicationRouter from './application.routes.js';
import liveSessionRouter from './liveSession.routes.js';
import siteVisitRouter from './siteVisit.routes.js';
import enquiryRouter from './enquiry.routes.js'; // Import
import dashboardRouter from './dashboard.routes.js';

const router = Router();

router.use("/auth", authRouter);
router.use("/consultation", consultationRouter);
router.use("/application", applicationRouter);
router.use("/live-session", liveSessionRouter);
router.use("/site-visit", siteVisitRouter);
router.use("/enquiry", enquiryRouter); // Register
router.use("/dashboard", dashboardRouter);

export default router;