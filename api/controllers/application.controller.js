import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { JoinUsApplication } from '../models/joinUsApplication.model.js';
import sendEmail from '../services/email.service.js';

const createApplication = asyncHandler(async (req, res) => {
    const { name, contact, state, address, qualifications, experience } = req.body;

    if ([name, contact, state, address, qualifications, experience].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const application = await JoinUsApplication.create({ name, contact, state, address, qualifications, experience });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #D7281E;">New 'Join Us' Application</h2>
                <p>A new expert has applied to join the Vastumaye team.</p>
                <hr>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>State:</strong> ${state}</p>
                <p><strong>Qualifications:</strong> ${qualifications}</p>
                <p><strong>Experience:</strong> ${experience}</p>
            </div>
        `;
        await sendEmail({
            to: adminEmail,
            subject: `New Team Application from ${name}`,
            html: htmlMessage
        });
    }

    return res.status(201).json(new ApiResponse(201, application, "Application submitted successfully! We will get in touch with you shortly."));
});

const getAllApplications = asyncHandler(async (req, res) => {
    const applications = await JoinUsApplication.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully."));
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const application = await JoinUsApplication.findByIdAndUpdate(id, { status }, { new: true });

    if (!application) {
        throw new ApiError(404, "Application not found.");
    }

    return res.status(200).json(new ApiResponse(200, application, `Application status updated to ${status}.`));
});

const deleteApplications = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, "No IDs provided for deletion.");
    }

    await JoinUsApplication.deleteMany({ _id: { $in: ids } });

    return res.status(200).json(new ApiResponse(200, {}, "Selected applications deleted successfully."));
});

export { createApplication, getAllApplications, updateApplicationStatus, deleteApplications };