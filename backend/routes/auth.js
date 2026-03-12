import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Register a new user (supports patient/doctor roles)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone,
            // Doctor fields
            specialization, licenseNumber, experience, qualification, consultationFee,
            // Patient fields
            dateOfBirth, gender, bloodGroup } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'patient',
            phone
        });

        // Create role-specific profile
        if (role === 'doctor') {
            await Doctor.create({
                userId: user._id,
                specialization: specialization || 'General',
                licenseNumber: licenseNumber || `LIC-${Date.now()}`,
                experience: experience || 0,
                qualification: qualification || '',
                consultationFee: consultationFee || 500
            });
        } else if (role === 'patient' || !role) {
            await Patient.create({
                userId: user._id,
                dateOfBirth: dateOfBirth || new Date('2000-01-01'),
                gender: gender || 'other',
                bloodGroup: bloodGroup || 'O+'
            });
        }

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP for two-factor authentication
// @access  Public
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const otp = generateOTP();
        user.otpCode = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // In production, send OTP via SMS/email. For demo, return in response.
        res.json({
            success: true,
            message: 'OTP sent successfully',
            otp: otp // Remove in production
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email }).select('+otpCode +otpExpiry');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.otpCode || user.otpCode !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        // Clear OTP
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        user.twoFactorEnabled = true;
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            message: 'OTP verified successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user with role-specific profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let profile = null;

        if (user.role === 'doctor') {
            profile = await Doctor.findOne({ userId: user._id });
        } else if (user.role === 'patient') {
            profile = await Patient.findOne({ userId: user._id });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                profileImage: user.profileImage,
                twoFactorEnabled: user.twoFactorEnabled,
                profile
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
