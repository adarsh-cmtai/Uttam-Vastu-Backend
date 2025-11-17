import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Consultation } from '../models/consultation.model.js';
import sendEmail from '../services/email.service.js';

const createConsultationRequest = asyncHandler(async (req, res) => {
    const { name, email, phone, city, purpose, propertyType, comments } = req.body;

    if ([name, email, phone, city, purpose, propertyType].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All required fields must be filled.");
    }

    const newRequest = await Consultation.create({
        name,
        email,
        phone,
        city,
        purpose,
        propertyType,
        comments
    });

    if (!newRequest) {
        throw new ApiError(500, "Something went wrong while saving the request.");
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const whatsappUrl = `https://wa.me/${process.env.ADMIN_WHATSAPP_NUMBER}`;
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #D7281E;">New Vastu Consultation Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>City:</strong> ${city}</p>
                <p><strong>Purpose:</strong> ${purpose}</p>
                <p><strong>Property Type:</strong> ${propertyType}</p>
                <p><strong>Comments:</strong> ${comments || 'N/A'}</p>
                 <p>
                    <a href="${whatsappUrl}" target="_blank" style="background-color: #25D366; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Open WhatsApp Chat
                    </a>
                </p>
            </div>
        `;

        await sendEmail({
            to: adminEmail,
            subject: `New Vastu Request from ${name}`,
            html: htmlMessage
        });
    }

    return res.status(201).json(new ApiResponse(201, newRequest, "Thank you for your request! We will get back to you shortly."));
});

const getAllConsultationRequests = asyncHandler(async (req, res) => {
    const requests = await Consultation.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, requests, "Consultation requests fetched successfully."));
});

const replyToConsultation = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
        throw new ApiError(400, "Subject and message are required for the reply.");
    }

    const request = await Consultation.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Consultation request not found.");
    }

    const htmlReply = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h2 style="color: #D7281E;">Re: Your Vastu Consultation Request</h2>
            <p>Hello ${request.name},</p>
            <p>Thank you for reaching out to Vastumaye. Here is a reply regarding your enquiry:</p>
            <div style="background-color: #f9f9f9; border-left: 4px solid #D7281E; padding: 15px; margin: 20px 0;">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <p>If you have any further questions, feel free to reply to this email.</p>
            <br>
            <p>Warm Regards,</p>
            <p><strong>The Vastumaye Team</strong></p>
        </div>
    `;

    await sendEmail({
        to: request.email,
        subject: subject,
        html: htmlReply
    });
    
    request.status = 'Contacted';
    await request.save();

    return res.status(200).json(new ApiResponse(200, {}, "Reply sent successfully."));
});


export { createConsultationRequest, getAllConsultationRequests, replyToConsultation };