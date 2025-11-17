import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpiry: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

verificationSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 600 }); // Entry 10 minute baad delete ho jayegi

export const Verification = mongoose.model('Verification', verificationSchema);