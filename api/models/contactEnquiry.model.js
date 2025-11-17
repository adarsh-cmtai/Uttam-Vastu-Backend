import mongoose from 'mongoose';

const contactEnquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Resolved'],
        default: 'New'
    }
}, { timestamps: true });

export const ContactEnquiry = mongoose.model('ContactEnquiry', contactEnquirySchema);