import mongoose from 'mongoose';

const labTestSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    testType: {
        type: String,
        required: true,
        trim: true
    },
    testCategory: {
        type: String,
        enum: ['blood', 'urine', 'imaging', 'biopsy', 'cardiac', 'other'],
        default: 'blood'
    },
    status: {
        type: String,
        enum: ['booked', 'sample_collected', 'processing', 'completed', 'cancelled'],
        default: 'booked'
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    results: {
        summary: String,
        details: mongoose.Schema.Types.Mixed,
        normalRange: String,
        isAbnormal: Boolean
    },
    reportUrl: String,
    reportUploadedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    reviewNotes: String,
    reviewedAt: Date,
    labName: String,
    cost: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    }
}, {
    timestamps: true
});

labTestSchema.index({ patientId: 1, scheduledDate: -1 });

const LabTest = mongoose.model('LabTest', labTestSchema);
export default LabTest;
