import express from 'express';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/appointments
router.get('/', protect, async (req, res) => {
    try {
        const { status, doctorId, patientId } = req.query;
        let filter = {};

        if (req.user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: req.user._id });
            if (doc) filter.doctorId = doc._id;
        } else if (req.user.role === 'patient') {
            const pat = await Patient.findOne({ userId: req.user._id });
            if (pat) filter.patientId = pat._id;
        }

        if (status) filter.status = status;
        if (doctorId) filter.doctorId = doctorId;
        if (patientId) filter.patientId = patientId;

        const appointments = await Appointment.find(filter)
            .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone profileImage' } })
            .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone' } })
            .sort({ dateTime: -1 })
            .limit(50);

        res.json({ success: true, data: appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/appointments/available-slots
router.get('/available-slots', protect, async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const daySchedule = doctor.availability.find(a => a.day === dayOfWeek);

        if (!daySchedule) {
            return res.json({ success: true, data: [] });
        }

        // Generate slots
        const slots = [];
        const [startH, startM] = daySchedule.startTime.split(':').map(Number);
        const [endH, endM] = daySchedule.endTime.split(':').map(Number);
        const duration = daySchedule.slotDuration || 30;

        let current = startH * 60 + startM;
        const end = endH * 60 + endM;

        // Get existing appointments for that day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const booked = await Appointment.find({
            doctorId,
            dateTime: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] }
        });

        const bookedTimes = booked.map(a => {
            const d = new Date(a.dateTime);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        });

        while (current + duration <= end) {
            const h = Math.floor(current / 60).toString().padStart(2, '0');
            const m = (current % 60).toString().padStart(2, '0');
            const timeStr = `${h}:${m}`;
            slots.push({
                time: timeStr,
                available: !bookedTimes.includes(timeStr)
            });
            current += duration;
        }

        res.json({ success: true, data: slots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/appointments
router.post('/', protect, async (req, res) => {
    try {
        let { doctorId, dateTime, type, reason, symptoms } = req.body;
        let patientId = req.body.patientId;

        // Auto-fill the caller's own profile ID
        if (req.user.role === 'patient') {
            const pat = await Patient.findOne({ userId: req.user._id });
            if (pat) patientId = pat._id;
        } else if (req.user.role === 'doctor' && !doctorId) {
            const doc = await Doctor.findOne({ userId: req.user._id });
            if (doc) doctorId = doc._id;
        }

       if (!doctorId) {
    return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
    });
}

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: 'Doctor not found'
        });
    }

    const fee = Number(doctor.consultationFee || 500);

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            dateTime,
            type: type || 'in-person',
            reason,
            symptoms,
            payment: {
                amount: fee,
                status: 'pending'
            },
            meetingLink: type === 'video' ? `https://meet.medicare.com/${Date.now()}` : undefined
        });

        res.status(201).json({ success: true, data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/appointments/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/appointments/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );
        if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        res.json({ success: true, data: appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
