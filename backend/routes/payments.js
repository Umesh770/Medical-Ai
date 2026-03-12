import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

import Appointment from '../models/Appointment.js';
import LabTest from '../models/LabTest.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

// @route   POST /api/payments/create-intent
router.post('/create-intent', protect, async (req, res) => {
    try {
        const { amount, currency, referenceId, description, type } = req.body;

        // Mock payment intent (Replace with real Stripe/Razorpay in production)
        const paymentIntent = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: amount,
            currency: currency || 'INR',
            status: 'created',
            referenceId,
            type,
            description: description || 'Medical fee',
            createdAt: new Date()
        };

        res.json({ success: true, data: paymentIntent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/payments/verify
router.post('/verify', protect, async (req, res) => {
    try {
        const { paymentId, referenceId, type, status } = req.body;

        if (type === 'appointment') {
            await Appointment.findByIdAndUpdate(referenceId, {
                'payment.status': status === 'completed' ? 'paid' : 'pending',
                'payment.transactionId': paymentId
            });
        } else if (type === 'labtest') {
            await LabTest.findByIdAndUpdate(referenceId, {
                paymentStatus: status === 'completed' ? 'paid' : 'pending'
            });
        }

        res.json({
            success: true,
            data: {
                paymentId,
                status: status || 'paid',
                verifiedAt: new Date(),
                receipt: `RCP-${Date.now()}`
            },
            message: 'Payment verified successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/payments/history
router.get('/history', protect, async (req, res) => {
    try {
        const history = [];

        if (req.user.role === 'patient') {
            const pat = await Patient.findOne({ userId: req.user._id });
            if (!pat) return res.json({ success: true, data: [] });

            // Get Appointments
            const appointments = await Appointment.find({ patientId: pat._id })
                .populate({ path: 'doctorId', populate: { path: 'userId' } });

            appointments.forEach(a => {
                history.push({
                    _id: a._id.toString(),
                    id: `pay_${a._id}`,
                    appointmentId: a._id,
                    type: 'appointment',
                    description: `Consultation with Dr. ${a.doctorId?.userId?.name || 'Unknown'}`,
                    amount: a.payment?.amount || 500,
                    status: a.payment?.status === 'paid' ? 'completed' : 'pending',
                    date: a.dateTime,
                    receipt: a.payment?.status === 'paid' ? `RCP-${a._id.toString().slice(-6)}` : null
                });
            });

            // Get Lab Tests
            const tests = await LabTest.find({ patientId: pat._id });
            tests.forEach(t => {
                history.push({
                    _id: t._id.toString(),
                    id: `pay_${t._id}`,
                    appointmentId: t._id,
                    type: 'labtest',
                    description: `${t.testName || t.testType} - ${t.labName || 'Lab'}`,
                    amount: t.cost || 0,
                    status: t.paymentStatus === 'paid' ? 'completed' : 'pending',
                    date: t.scheduledDate,
                    receipt: t.paymentStatus === 'paid' ? `RCP-${t._id.toString().slice(-6)}` : null
                });
            });
        } else if (req.user.role === 'doctor') {
            const doc = await Doctor.findOne({ userId: req.user._id });
            if (!doc) return res.json({ success: true, data: [] });

            const appointments = await Appointment.find({ doctorId: doc._id })
                .populate({ path: 'patientId', populate: { path: 'userId' } });

            appointments.forEach(a => {
                history.push({
                    _id: a._id.toString(),
                    id: `pay_${a._id}`,
                    appointmentId: a._id,
                    type: 'appointment',
                    description: `Consultation from ${a.patientId?.userId?.name || 'Patient'}`,
                    amount: a.payment?.amount || 500,
                    status: a.payment?.status === 'paid' ? 'completed' : 'pending',
                    date: a.dateTime,
                    receipt: a.payment?.status === 'paid' ? `RCP-${a._id.toString().slice(-6)}` : null
                });
            });
        }

        // Sort by date descending
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/payments/:id/invoice
router.get('/:id/invoice', protect, async (req, res) => {
    try {
        const invoice = {
            invoiceNumber: `INV-MC-${Date.now()}`,
            paymentId: req.params.id,
            patientName: req.user.name,
            date: new Date(),
            items: [
                { description: 'Medical Consultation', amount: 500 },
                { description: 'Platform Fee', amount: 25 },
                { description: 'GST (18%)', amount: 94.5 }
            ],
            total: 619.5,
            status: 'paid'
        };

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
