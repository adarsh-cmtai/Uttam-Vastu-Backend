import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ContactEnquiry } from '../models/contactEnquiry.model.js';
import { Consultation } from '../models/consultation.model.js';
import { JoinUsApplication } from '../models/joinUsApplication.model.js';
import { LiveSessionBooking } from '../models/liveSessionBooking.model.js';
import { SiteVisitApplication } from '../models/siteVisitApplication.model.js';

const getDashboardStats = asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const selectedYear = parseInt(year) || currentDate.getFullYear();
    const selectedMonth = parseInt(month) || (currentDate.getMonth() + 1);

    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const [
        totalEnquiries,
        totalConsultations,
        totalJoinUs,
        totalLiveSessions,
        totalSiteVisits,
        pendingJoinUs
    ] = await Promise.all([
        ContactEnquiry.countDocuments(),
        Consultation.countDocuments(),
        JoinUsApplication.countDocuments(),
        LiveSessionBooking.countDocuments(),
        SiteVisitApplication.countDocuments(),
        JoinUsApplication.countDocuments({ status: 'Pending Review' })
    ]);

    const getMonthlyCount = async (Model) => {
        return await Model.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });
    };

    const [
        monthlyEnquiries,
        monthlyConsultations,
        monthlyJoinUs,
        monthlyLiveSessions,
        monthlySiteVisits
    ] = await Promise.all([
        getMonthlyCount(ContactEnquiry),
        getMonthlyCount(Consultation),
        getMonthlyCount(JoinUsApplication),
        getMonthlyCount(LiveSessionBooking),
        getMonthlyCount(SiteVisitApplication)
    ]);

    const getDailyData = async (Model) => {
        return await Model.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);
    };

    const [
        dailyEnquiries,
        dailyConsultations,
        dailyJoinUs
    ] = await Promise.all([
        getDailyData(ContactEnquiry),
        getDailyData(Consultation),
        getDailyData(JoinUsApplication)
    ]);

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const graphData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const findCount = (data) => data.find(d => d._id === day)?.count || 0;
        return {
            day: day,
            enquiries: findCount(dailyEnquiries),
            consultations: findCount(dailyConsultations),
            applications: findCount(dailyJoinUs)
        };
    });

    const recentEnquiries = await ContactEnquiry.find().sort({ createdAt: -1 }).limit(5).select('name createdAt');
    const recentConsultations = await Consultation.find().sort({ createdAt: -1 }).limit(5).select('name createdAt');
    const recentJoinUs = await JoinUsApplication.find().sort({ createdAt: -1 }).limit(5).select('name createdAt');
    
    const recentActivity = [
        ...recentEnquiries.map(item => ({ type: 'enquiry', person: item.name, createdAt: item.createdAt })),
        ...recentConsultations.map(item => ({ type: 'consultation', person: item.name, createdAt: item.createdAt })),
        ...recentJoinUs.map(item => ({ type: 'application', person: item.name, createdAt: item.createdAt }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 7);

    const stats = {
        total: {
            enquiries: totalEnquiries,
            consultations: totalConsultations,
            joinUs: totalJoinUs,
            liveSessions: totalLiveSessions,
            siteVisits: totalSiteVisits,
            pendingJoinUs
        },
        monthly: {
            enquiries: monthlyEnquiries,
            consultations: monthlyConsultations,
            joinUs: monthlyJoinUs,
            liveSessions: monthlyLiveSessions,
            siteVisits: monthlySiteVisits,
            totalLeads: monthlyEnquiries + monthlyConsultations + monthlyJoinUs + monthlyLiveSessions + monthlySiteVisits
        },
        graphData,
        recentActivity
    };

    return res.status(200).json(new ApiResponse(200, stats, "Dashboard data fetched successfully."));
});

const downloadReport = asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    
    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month);
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const [enquiries, consultations, applications, liveSessions, siteVisits] = await Promise.all([
        ContactEnquiry.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean(),
        Consultation.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean(),
        JoinUsApplication.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean(),
        LiveSessionBooking.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean(),
        SiteVisitApplication.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean()
    ]);

    let csvContent = "Category,Date,Name,Email/Contact,Status,Details\n";

    const escapeCsv = (str) => {
        if (!str) return "";
        return `"${str.toString().replace(/"/g, '""')}"`;
    };

    enquiries.forEach(item => {
        csvContent += `Enquiry,${item.createdAt.toISOString().split('T')[0]},${escapeCsv(item.name)},${escapeCsv(item.email)},${item.status},${escapeCsv(item.subject)}\n`;
    });

    consultations.forEach(item => {
        csvContent += `Consultation,${item.createdAt.toISOString().split('T')[0]},${escapeCsv(item.name)},${escapeCsv(item.phone)},${item.status},${escapeCsv(item.purpose + ' - ' + item.propertyType)}\n`;
    });

    applications.forEach(item => {
        csvContent += `Join Us App,${item.createdAt.toISOString().split('T')[0]},${escapeCsv(item.name)},${escapeCsv(item.contact)},${item.status},${escapeCsv(item.state)}\n`;
    });

    liveSessions.forEach(item => {
        csvContent += `Live Session,${item.createdAt.toISOString().split('T')[0]},${escapeCsv(item.name)},${escapeCsv(item.contact)},${item.status},${escapeCsv(item.chosenPackage)}\n`;
    });

    siteVisits.forEach(item => {
        csvContent += `Site Visit,${item.createdAt.toISOString().split('T')[0]},${escapeCsv(item.name)},${escapeCsv(item.contact)},${item.status},${escapeCsv(item.location + ' - ' + item.chosenPackage)}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`Vastumaye_Report_${selectedMonth}_${selectedYear}.csv`);
    return res.send(csvContent);
});

export { getDashboardStats, downloadReport };