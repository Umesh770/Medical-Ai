import express from 'express';
import Truck from '../models/Truck.js';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/trucks
router.get('/', protect, async (req, res) => {
    try {
        const { status } = req.query;
        let filter = { isActive: true };
        if (status) filter.status = status;

        const trucks = await Truck.find(filter).sort({ updatedAt: -1 });
        res.json({ success: true, data: trucks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/trucks/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });
        res.json({ success: true, data: truck });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/trucks
router.post('/', protect, async (req, res) => {
    try {
        const truck = await Truck.create(req.body);
        res.status(201).json({ success: true, data: truck });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/trucks/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const truck = await Truck.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });
        res.json({ success: true, data: truck });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/trucks/:id/temperature
router.post('/:id/temperature', protect, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });

        const { temperature } = req.body;
        const isBreached = temperature > truck.temperatureSettings.max || temperature < truck.temperatureSettings.min;

        truck.temperatureLog.push({ temperature, isBreached, timestamp: new Date() });

        // Keep only last 288 readings (24 hours at 5-min intervals)
        if (truck.temperatureLog.length > 288) {
            truck.temperatureLog = truck.temperatureLog.slice(-288);
        }

        await truck.save();

        // Create alert if breached
        if (isBreached) {
            await Alert.create({
                type: 'temperature_breach',
                severity: 'high',
                truckId: truck._id,
                title: `Temperature breach on ${truck.vehicleNumber}`,
                description: `Temperature recorded: ${temperature}°C (Limit: ${truck.temperatureSettings.min}°C to ${truck.temperatureSettings.max}°C)`,
                location: truck.currentLocation
            });
        }

        res.json({ success: true, data: { temperature, isBreached }, message: isBreached ? 'ALERT: Temperature breach!' : 'Temperature logged' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/trucks/:id/door-event
router.post('/:id/door-event', protect, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });

        const { isOpen } = req.body;
        truck.doorStatus.isOpen = isOpen;
        truck.doorStatus.lastChanged = new Date();
        if (isOpen) truck.doorStatus.openCount += 1;
        await truck.save();

        if (isOpen) {
            await Alert.create({
                type: 'door_open',
                severity: 'medium',
                truckId: truck._id,
                title: `Door opened on ${truck.vehicleNumber}`,
                description: `Door opened at ${new Date().toLocaleTimeString()}. Total opens: ${truck.doorStatus.openCount}`,
                location: truck.currentLocation
            });
        }

        res.json({ success: true, data: truck.doorStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/trucks/:id/shock-event
router.post('/:id/shock-event', protect, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });

        const { intensity, location } = req.body;
        truck.shockEvents.push({ intensity, location, timestamp: new Date() });
        await truck.save();

        if (intensity > 3) {
            await Alert.create({
                type: 'shock',
                severity: 'high',
                truckId: truck._id,
                title: `High impact detected on ${truck.vehicleNumber}`,
                description: `Shock intensity: ${intensity}G detected during transport.`,
                location
            });
        }

        res.json({ success: true, data: { intensity, logged: true } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/trucks/:id/location
router.put('/:id/location', protect, async (req, res) => {
    try {
        const truck = await Truck.findById(req.params.id);
        if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });

        truck.currentLocation = { ...req.body, lastUpdated: new Date() };
        await truck.save();

        // Check geofence
        if (truck.geofence.enabled && truck.geofence.boundaries.length > 0) {
            // Simple radius check from first boundary point
            const center = truck.geofence.boundaries[0];
            const distance = Math.sqrt(
                Math.pow(req.body.latitude - center.latitude, 2) +
                Math.pow(req.body.longitude - center.longitude, 2)
            ) * 111; // rough km conversion

            if (distance > (truck.geofence.radius || 50)) {
                await Alert.create({
                    type: 'geofence',
                    severity: 'high',
                    truckId: truck._id,
                    title: `Geofence violation: ${truck.vehicleNumber}`,
                    description: `Truck has left the approved route area. Distance from boundary: ${distance.toFixed(1)} km`,
                    location: req.body
                });
            }
        }

        res.json({ success: true, data: truck.currentLocation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
