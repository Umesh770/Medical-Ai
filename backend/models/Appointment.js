import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        default: 30 // minutes
    },
    type: {
        type: String,
        enum: ['video', 'in-person', 'phone'],
        default: 'in-person'
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    reason: {
        type: String,
        trim: true
    },
    symptoms: [String],
    notes: {
        type: String
    },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
   payment: {
    amount: Number,
    status: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    transactionId: String,
    method: String,

    // Razorpay fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
},
    reminder: {
        sent: { type: Boolean, default: false },
        sentAt: Date
    },
    meetingLink: String
}, {
    timestamps: true
});

appointmentSchema.index({ doctorId: 1, dateTime: 1 });
appointmentSchema.index({ patientId: 1, dateTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
