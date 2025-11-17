import mongoose from 'mongoose';

const liveSessionBookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    qualifications: { type: String, required: true },
    experience: { type: String, required: true },
    chosenPackage: { type: String, required: true },
    status: {
        type: String,
        enum: ['Payment Pending', 'Confirmed', 'Completed'],
        default: 'Payment Pending'
    }
}, { timestamps: true });

export const LiveSessionBooking = mongoose.model('LiveSessionBooking', liveSessionBookingSchema);