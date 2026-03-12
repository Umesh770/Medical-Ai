import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['emergency', 'temperature_breach', 'geofence', 'door_open', 'shock', 'low_battery', 'theft'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'high'
    },
    // For patient emergency alerts
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    },
    // For cold-chain alerts
    truckId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Truck'
    },
    storageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storage'
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
        default: 'active'
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    respondedAt: Date,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ type: 1, status: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
