import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { User } from '../models/user.model.js';
import { Verification } from '../models/verification.model.js';
import sendEmail from '../services/email.service.js';
import crypto from 'crypto';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if ([name, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    await Verification.deleteOne({ email });

    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    await Verification.create({ name, email, password, otp, otpExpiry });
    
    const message = `<h2>Welcome to Vastumaye!</h2><p>Your One-Time Password (OTP) for email verification is:</p><h1>${otp}</h1><p>This OTP is valid for 10 minutes.</p>`;

    await sendEmail({ to: email, subject: 'Verify Your Email - Vastumaye', html: message });

    return res.status(201).json(new ApiResponse(201, { email }, "User registered. Please check your email for the OTP."));
});

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, "Email and OTP are required.");

    const verificationEntry = await Verification.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });

    if (!verificationEntry) {
        throw new ApiError(400, "Invalid or expired OTP.");
    }
    
    await User.create({ name: verificationEntry.name, email: verificationEntry.email, password: verificationEntry.password });
    
    await Verification.deleteOne({ email });

    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully. You can now log in."));
});

const resendVerificationOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required.");
    
    const verificationEntry = await Verification.findOne({ email });
    if (!verificationEntry) {
        throw new ApiError(404, "No pending registration found for this email. Please register again.");
    }
    
    const otp = generateOTP();
    verificationEntry.otp = otp;
    verificationEntry.otpExpiry = Date.now() + 10 * 60 * 1000;
    await verificationEntry.save({ validateBeforeSave: false });
    
    const message = `<p>Your new One-Time Password (OTP) is:</p><h1>${otp}</h1><p>This OTP is valid for 10 minutes.</p>`;

    await sendEmail({ to: email, subject: 'Your New Verification OTP - Vastumaye', html: message });
    
    return res.status(200).json(new ApiResponse(200, {}, "A new OTP has been sent to your email address."));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        const pendingVerification = await Verification.findOne({ email });
        if (pendingVerification) {
            throw new ApiError(401, "Your email is not verified yet. Please check your inbox for the OTP.");
        }
        throw new ApiError(404, "User not found. Please register first.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    };
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });
    if (user) {
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        const message = `<h2>Password Reset Request</h2><p>Click the link to reset your password:</p><a href="${resetUrl}" target="_blank">Reset Password</a>`;

        await sendEmail({ to: user.email, subject: 'Password Reset Request - Vastumaye', html: message });
    }
    
    return res.status(200).json(new ApiResponse(200, {}, "If a user with that email exists, a password reset link has been sent."));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;
    if (!token || !password) throw new ApiError(400, "Token and new password are required.");

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ forgotPasswordToken: hashedToken, forgotPasswordExpiry: { $gt: Date.now() } });

    if (!user) {
        throw new ApiError(400, "Token is invalid or has expired.");
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password has been reset successfully."));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );
    
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    };

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully."));
});

export { registerUser, verifyOTP, resendVerificationOTP, loginUser, forgotPassword, resetPassword, logoutUser, getCurrentUser };