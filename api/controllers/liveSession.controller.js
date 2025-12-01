import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { LiveSessionBooking } from '../models/liveSessionBooking.model.js';
import sendEmail from '../services/email.service.js';

const createBooking = asyncHandler(async (req, res) => {
    const { name, contact, state, address, qualifications, experience, chosenPackage } = req.body;

    if (!name || !contact || !state || !chosenPackage) {
        throw new ApiError(400, "All required fields must be filled.");
    }

    const booking = await LiveSessionBooking.create(req.body);

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #D7281E;">New Live Session Booking</h2>
                <p>A student has booked a live session.</p>
                <hr>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>State:</strong> ${state}</p>
                <p><strong>Chosen Package:</strong> ${chosenPackage}</p>
                <p><strong>Qualifications:</strong> ${qualifications}</p>
                <p><strong>Experience:</strong> ${experience}</p>
            </div>
        `;
        await sendEmail({
            to: adminEmail,
            subject: `New Live Session Booking from ${name}`,
            html: htmlMessage
        });
    }

    return res.status(201).json(new ApiResponse(201, booking, "Booking successful! We will contact you with session details."));
});

const getAllBookings = asyncHandler(async (req, res) => {
    const bookings = await LiveSessionBooking.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, bookings, "Bookings fetched successfully."));
});

const updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Confirmed', 'Completed'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const booking = await LiveSessionBooking.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) throw new ApiError(404, "Booking not found.");

    return res.status(200).json(new ApiResponse(200, booking, `Booking status updated to ${status}.`));
});

const deleteBookings = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, "No IDs provided for deletion.");
    }

    await LiveSessionBooking.deleteMany({ _id: { $in: ids } });

    return res.status(200).json(new ApiResponse(200, {}, "Selected bookings deleted successfully."));
});

export { createBooking, getAllBookings, updateBookingStatus, deleteBookings };