import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    experience: {
        type: Number,
        default: 0
    },
    qualification: {
        type: String,
        trim: true
    },
    consultationFee: {
        type: Number,
        default: 500,
        min: 0
    },
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String, // "09:00"
        endTime: String,   // "17:00"
        slotDuration: { type: Number, default: 30 } // minutes
    }],
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    department: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: 500
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
