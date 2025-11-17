import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    purpose: { type: String, required: true },
    propertyType: { type: String, required: true },
    comments: { type: String, trim: true },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Resolved'],
        default: 'Pending'
    }
}, { timestamps: true });

export const Consultation = mongoose.model('Consultation', consultationSchema);