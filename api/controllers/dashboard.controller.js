import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ContactEnquiry } from '../models/contactEnquiry.model.js';
import { Consultation } from '../models/consultation.model.js';
import { JoinUsApplication } from '../models/joinUsApplication.model.js';
import { LiveSessionBooking } from '../models/liveSessionBooking.model.js';
import { SiteVisitApplication } from '../models/siteVisitApplication.model.js';

const getDashboardStats = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalEnquiries,
        totalConsultations,
        totalJoinUs,
        pendingJoinUs,
        todayEnquiries,
        todayConsultations,
        todayJoinUs,
        todayLiveSessions,
        todaySiteVisits,
    ] = await Promise.all([
        ContactEnquiry.countDocuments(),
        Consultation.countDocuments(),
        JoinUsApplication.countDocuments(),
        JoinUsApplication.countDocuments({ status: 'Pending Review' }),
        ContactEnquiry.countDocuments({ createdAt: { $gte: today } }),
        Consultation.countDocuments({ createdAt: { $gte: today } }),
        JoinUsApplication.countDocuments({ createdAt: { $gte: today } }),
        LiveSessionBooking.countDocuments({ createdAt: { $gte: today } }),
        SiteVisitApplication.countDocuments({ createdAt: { $gte: today } }),
    ]);

    const todaysNewLeads = todayEnquiries + todayConsultations + todayJoinUs + todayLiveSessions + todaySiteVisits;

    const stats = {
        todaysNewLeads,
        totalEnquiries,
        totalConsultations,
        totalJoinUs,
        pendingJoinUs
    };

    const recentEnquiries = await ContactEnquiry.find().sort({ createdAt: -1 }).limit(5).select('name createdAt');
    const recentConsultations = await Consultation.find().sort({ createdAt: -1 }).limit(5).select('name createdAt');
    const recentJoinUs = await JoinUsApplication.find().sort({ createdAt: -1 }).limit(5).select('name createdAt');
    
    const formattedEnquiries = recentEnquiries.map(item => ({ type: 'enquiry', person: item.name, createdAt: item.createdAt }));
    const formattedConsultations = recentConsultations.map(item => ({ type: 'consultation', person: item.name, createdAt: item.createdAt }));
    const formattedJoinUs = recentJoinUs.map(item => ({ type: 'application', person: item.name, createdAt: item.createdAt }));

    const recentActivity = [...formattedEnquiries, ...formattedConsultations, ...formattedJoinUs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 7);

    return res.status(200).json(new ApiResponse(200, { stats, recentActivity }, "Dashboard data fetched successfully."));
});

export { getDashboardStats };