import express from 'express';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/agora/token
// @desc    Get Agora Token for a channel
// @access  Private
router.post('/token', protect, (req, res) => {
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    res.header('Access-Control-Allow-Origin', '*');

    const { channelName, uid, role } = req.body;

    if (!channelName) {
        return res.status(400).json({ error: 'channelName is required' });
    }

    // Set role
    let agoraRole = RtcRole.SUBSCRIBER;
    if (role === 'publisher') {
        agoraRole = RtcRole.PUBLISHER;
    }

    // Token set to expire in 1 hour
    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    let token;
    try {
        // UID must be a number for Agora. MongoDB ObjectIDs are strings,
        // so fall back to 0 (auto-assign) when uid is non-numeric.
        const uidNum = uid ? (isNaN(Number(uid)) ? 0 : Number(uid)) : 0;

        token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uidNum,
            agoraRole,
            privilegeExpireTime
        );
    } catch (err) {
        console.error("Agora Token Error: ", err);
        return res.status(500).json({ error: 'Failed to generate token' });
    }

    return res.json({ token });
});

export default router;
