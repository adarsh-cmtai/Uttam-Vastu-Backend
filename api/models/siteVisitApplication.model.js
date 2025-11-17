import mongoose from 'mongoose';

const siteVisitApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    qualifications: { type: String, required: true },
    experience: { type: String, required: true },
    chosenPackage: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending Review', 'Approved', 'Scheduled'],
        default: 'Pending Review'
    }
}, { timestamps: true });

export const SiteVisitApplication = mongoose.model('SiteVisitApplication', siteVisitApplicationSchema);