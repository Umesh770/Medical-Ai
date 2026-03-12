import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'prescription', 'report'],
        default: 'text'
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number
    }],
    readAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

// Static to generate conversation ID from two user IDs
messageSchema.statics.getConversationId = function (userId1, userId2) {
    return [userId1, userId2].sort().join('_');
};

const Message = mongoose.model('Message', messageSchema);
export default Message;
