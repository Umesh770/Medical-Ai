import 'dotenv/config';

import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';

import { protect } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ======================================================
// CREATE RAZORPAY ORDER
// POST /api/payments/create-order
// ======================================================

router.post('/create-order', protect, async (req, res) => {
    try {

        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID is required'
            });
        }

        const appointment =
            await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        const amount =
            Number(appointment.payment?.amount || 0);

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment amount'
            });
        }

        // Razorpay uses paise
        const amountInPaise =
            Math.round(amount * 100);

        const order =
            await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `apt_${appointment._id}`
            });

        // Save Razorpay order ID
        appointment.payment.razorpayOrderId =
            order.id;

        await appointment.save();

        console.log(
            'Razorpay order created:',
            order.id
        );

        return res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId:
                    process.env.RAZORPAY_KEY_ID,
                appointmentId:
                    appointment._id
            }
        });

    } catch (error) {

        console.error(
            'RAZORPAY CREATE ORDER ERROR:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.error?.description ||
                error.message ||
                'Failed to create Razorpay order'
        });
    }
});


// ======================================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payments/verify
// ======================================================

router.post('/verify', protect, async (req, res) => {
    try {

        const {
            appointmentId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !appointmentId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment details'
            });
        }

        const appointment =
            await Appointment.findById(
                appointmentId
            );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Make sure this order belongs to this appointment
        if (
            appointment.payment?.razorpayOrderId &&
            appointment.payment.razorpayOrderId !==
            razorpay_order_id
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Razorpay order'
            });
        }

        // Generate expected signature
        const body =
            razorpay_order_id +
            '|' +
            razorpay_payment_id;

        const expectedSignature =
            crypto
                .createHmac(
                    'sha256',
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest('hex');

        // Verify signature
        if (
            expectedSignature !==
            razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Payment successful
        appointment.payment.status =
            'paid';

        appointment.payment.transactionId =
            razorpay_payment_id;

        appointment.payment.method =
            'razorpay';

        appointment.payment.razorpayOrderId =
            razorpay_order_id;

        appointment.payment.razorpayPaymentId =
            razorpay_payment_id;

        appointment.payment.razorpaySignature =
            razorpay_signature;

        appointment.status =
            'confirmed';

        await appointment.save();

        console.log(
            'Payment verified:',
            razorpay_payment_id
        );

        return res.json({
            success: true,
            message:
                'Payment verified successfully',
            data: {
                paymentId:
                    razorpay_payment_id,
                orderId:
                    razorpay_order_id,
                status: 'paid'
            }
        });

    } catch (error) {

        console.error(
            'RAZORPAY VERIFY ERROR:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                'Payment verification failed'
        });
    }
});


export default router;