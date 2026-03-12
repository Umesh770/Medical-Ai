import express from 'express';
import Message from '../models/Message.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/conversations
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const messages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: req.user._id },
                        { receiverId: req.user._id }
                    ],
                    isDeleted: false
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiverId', req.user._id] },
                                        { $eq: ['$readAt', null] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    }
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } }
        ]);

        // Populate user details
        let populated = await Message.populate(messages, [
            { path: 'lastMessage.senderId', select: 'name email profileImage role', model: 'User' },
            { path: 'lastMessage.receiverId', select: 'name email profileImage role', model: 'User' }
        ]);

        const userIdsToFetch = new Set();
        populated.forEach(conv => {
            if (conv.lastMessage.senderId && conv.lastMessage.senderId.role === 'patient') {
                userIdsToFetch.add(conv.lastMessage.senderId._id.toString());
            }
            if (conv.lastMessage.receiverId && conv.lastMessage.receiverId.role === 'patient') {
                userIdsToFetch.add(conv.lastMessage.receiverId._id.toString());
            }
        });

        const patients = await Patient.find({ userId: { $in: Array.from(userIdsToFetch) } }).select('userId address');
        const addressMap = {};
        patients.forEach(p => addressMap[p.userId.toString()] = p.address);

        populated = populated.map(conv => {
            const doc = { ...conv };

            if (doc.lastMessage.senderId && addressMap[doc.lastMessage.senderId._id.toString()]) {
                doc.lastMessage.senderId = { ...doc.lastMessage.senderId.toObject ? doc.lastMessage.senderId.toObject() : doc.lastMessage.senderId, address: addressMap[doc.lastMessage.senderId._id.toString()] };
            }
            if (doc.lastMessage.receiverId && addressMap[doc.lastMessage.receiverId._id.toString()]) {
                doc.lastMessage.receiverId = { ...doc.lastMessage.receiverId.toObject ? doc.lastMessage.receiverId.toObject() : doc.lastMessage.receiverId, address: addressMap[doc.lastMessage.receiverId._id.toString()] };
            }
            return doc;
        });

        res.json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/messages/:conversationId
router.get('/:conversationId', protect, async (req, res) => {
    try {
        let messages = await Message.find({
            conversationId: req.params.conversationId,
            isDeleted: false
        })
            .populate('senderId', 'name email profileImage role')
            .populate('receiverId', 'name email profileImage role')
            .sort({ createdAt: 1 })
            .limit(100);

        const userIdsToFetch = new Set();
        messages.forEach(msg => {
            if (msg.senderId && msg.senderId.role === 'patient') userIdsToFetch.add(msg.senderId._id.toString());
            if (msg.receiverId && msg.receiverId.role === 'patient') userIdsToFetch.add(msg.receiverId._id.toString());
        });

        const patients = await Patient.find({ userId: { $in: Array.from(userIdsToFetch) } }).select('userId address');
        const addressMap = {};
        patients.forEach(p => addressMap[p.userId.toString()] = p.address);

        messages = messages.map(msg => {
            const doc = msg.toObject ? msg.toObject() : { ...msg };
            if (doc.senderId && addressMap[doc.senderId._id.toString()]) {
                doc.senderId.address = addressMap[doc.senderId._id.toString()];
            }
            if (doc.receiverId && addressMap[doc.receiverId._id.toString()]) {
                doc.receiverId.address = addressMap[doc.receiverId._id.toString()];
            }
            return doc;
        });

        // Mark messages as read
        await Message.updateMany(
            {
                conversationId: req.params.conversationId,
                receiverId: req.user._id,
                readAt: null
            },
            { readAt: new Date() }
        );

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/messages
router.post('/', protect, async (req, res) => {
    try {
        const { receiverId, content, messageType, attachments } = req.body;
        const conversationId = Message.getConversationId(req.user._id.toString(), receiverId);

        const message = await Message.create({
            conversationId,
            senderId: req.user._id,
            receiverId,
            content,
            messageType: messageType || 'text',
            attachments: attachments || []
        });

        const populated = await message.populate([
            { path: 'senderId', select: 'name email profileImage role' },
            { path: 'receiverId', select: 'name email profileImage role' }
        ]);

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
