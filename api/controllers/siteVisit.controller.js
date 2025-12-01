import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { SiteVisitApplication } from '../models/siteVisitApplication.model.js';
import sendEmail from '../services/email.service.js';

const createApplication = asyncHandler(async (req, res) => {
    const { name, contact, location, address, qualifications, experience, chosenPackage } = req.body;

    if (!name || !contact || !location || !chosenPackage) {
        throw new ApiError(400, "All required fields must be filled.");
    }

    const application = await SiteVisitApplication.create(req.body);

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #D7281E;">New Site Visit Application</h2>
                <p>A student has applied for a practical site visit session.</p>
                <hr>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Package:</strong> ${chosenPackage}</p>
                <p><strong>Qualifications:</strong> ${qualifications}</p>
                <p><strong>Experience:</strong> ${experience}</p>
            </div>
        `;
        await sendEmail({
            to: adminEmail,
            subject: `New Site Visit Application from ${name}`,
            html: htmlMessage
        });
    }

    return res.status(201).json(new ApiResponse(201, application, "Application successful! We will contact you with session details."));
});

const getAllApplications = asyncHandler(async (req, res) => {
    const applications = await SiteVisitApplication.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully."));
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Approved', 'Scheduled'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const application = await SiteVisitApplication.findByIdAndUpdate(id, { status }, { new: true });
    if (!application) throw new ApiError(404, "Application not found.");

    return res.status(200).json(new ApiResponse(200, application, `Application status updated to ${status}.`));
});

const deleteApplications = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, "No IDs provided for deletion.");
    }

    await SiteVisitApplication.deleteMany({ _id: { $in: ids } });

    return res.status(200).json(new ApiResponse(200, {}, "Selected applications deleted successfully."));
});

export { createApplication, getAllApplications, updateApplicationStatus, deleteApplications };