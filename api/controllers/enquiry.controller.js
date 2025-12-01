import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ContactEnquiry } from '../models/contactEnquiry.model.js';
import sendEmail from '../services/email.service.js';

const createEnquiry = asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if ([name, email, phone, subject, message].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const enquiry = await ContactEnquiry.create(req.body);

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #D7281E;">New Contact Us Enquiry</h2>
                <hr>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="background-color: #f4f4f4; border-left: 3px solid #D7281E; padding: 10px;">${message}</p>
            </div>
        `;
        await sendEmail({
            to: adminEmail,
            subject: `New Enquiry: ${subject}`,
            html: htmlMessage
        });
    }

    return res.status(201).json(new ApiResponse(201, enquiry, "Thank you for contacting us! We will get back to you shortly."));
});

const getAllEnquiries = asyncHandler(async (req, res) => {
    const enquiries = await ContactEnquiry.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, enquiries, "Enquiries fetched successfully."));
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Contacted', 'Resolved'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const enquiry = await ContactEnquiry.findByIdAndUpdate(id, { status }, { new: true });
    if (!enquiry) throw new ApiError(404, "Enquiry not found.");

    return res.status(200).json(new ApiResponse(200, enquiry, `Enquiry status updated to ${status}.`));
});

const deleteEnquiries = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, "No IDs provided for deletion.");
    }

    await ContactEnquiry.deleteMany({ _id: { $in: ids } });

    return res.status(200).json(new ApiResponse(200, {}, "Selected enquiries deleted successfully."));
});

const replyToEnquiry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
        throw new ApiError(400, "Subject and message are required.");
    }

    const enquiry = await ContactEnquiry.findById(id);
    if (!enquiry) {
        throw new ApiError(404, "Enquiry not found.");
    }

    const htmlReply = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h2 style="color: #D7281E;">Re: ${enquiry.subject}</h2>
            <p>Hello ${enquiry.name},</p>
            <p>Thank you for contacting Vastumaye. Regarding your enquiry:</p>
            <div style="background-color: #f9f9f9; border-left: 4px solid #D7281E; padding: 15px; margin: 20px 0;">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <p>If you have further questions, please reply to this email.</p>
            <br>
            <p>Warm Regards,</p>
            <p><strong>The Vastumaye Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: enquiry.email,
        subject: subject,
        html: htmlReply
    });

    enquiry.status = 'Contacted';
    await enquiry.save();

    return res.status(200).json(new ApiResponse(200, {}, "Reply sent successfully."));
});

export { createEnquiry, getAllEnquiries, updateEnquiryStatus, deleteEnquiries, replyToEnquiry };