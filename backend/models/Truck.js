import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema({
    vehicleNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    driverName: {
        type: String,
        required: true,
        trim: true
    },
    driverPhone: {
        type: String,
        trim: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    route: {
        origin: String,
        destination: String,
        waypoints: [{ latitude: Number, longitude: Number, name: String }]
    },
    currentLocation: {
        latitude: Number,
        longitude: Number,
        lastUpdated: { type: Date, default: Date.now }
    },
    temperatureLog: [{
        temperature: Number,
        timestamp: { type: Date, default: Date.now },
        isBreached: Boolean
    }],
    temperatureSettings: {
        min: { type: Number, default: -25 },
        max: { type: Number, default: -15 },
        alertThreshold: { type: Number, default: -10 }
    },
    doorStatus: {
        isOpen: { type: Boolean, default: false },
        lastChanged: Date,
        openCount: { type: Number, default: 0 }
    },
    shockEvents: [{
        intensity: Number, // g-force
        timestamp: { type: Date, default: Date.now },
        location: { latitude: Number, longitude: Number }
    }],
    batteryLevel: {
        percentage: { type: Number, default: 100 },
        isCharging: { type: Boolean, default: false },
        lastUpdated: Date
    },
    geofence: {
        enabled: { type: Boolean, default: false },
        boundaries: [{
            latitude: Number,
            longitude: Number
        }],
        radius: Number // km
    },
    status: {
        type: String,
        enum: ['active', 'idle', 'maintenance', 'en-route', 'delivered'],
        default: 'idle'
    },
    cargo: {
        type: String,
        quantity: Number,
        loadedAt: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

truckSchema.index({ vehicleNumber: 1 });
truckSchema.index({ status: 1 });

const Truck = mongoose.model('Truck', truckSchema);
export default Truck;
