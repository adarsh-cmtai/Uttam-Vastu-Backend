import mongoose from 'mongoose';

const joinUsApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    qualifications: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['Pending Review', 'Approved', 'Rejected'],
        default: 'Pending Review'
    }
}, { timestamps: true });

export const JoinUsApplication = mongoose.model('JoinUsApplication', joinUsApplicationSchema);