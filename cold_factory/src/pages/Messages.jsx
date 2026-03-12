import { useState, useEffect, useRef } from 'react';
import { HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlineSearch, HiOutlineDotsVertical, HiOutlinePhone, HiOutlineX, HiOutlineUserAdd } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { messageAPI, doctorAPI, patientAPI } from '../services/api';
import toast from 'react-hot-toast';

const Messages = () => {
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';

    // Helper: format address object to string
    const formatAddress = (addr) => {
        if (!addr) return 'Address not available';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Address not available';
    };

    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    // Search modal state
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [loadingResults, setLoadingResults] = useState(false);
    const [patientProfile, setPatientProfile] = useState(null);

    useEffect(() => { fetchConversations(); if (!isDoctor) fetchPatientProfile(); }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchPatientProfile = async () => {
        try {
            const res = await patientAPI.getMyProfile();
            setPatientProfile(res.data.data);
        } catch (err) {
            // Patient profile may not exist
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await messageAPI.getConversations();
            setConversations(res.data.data || []);
        } catch (err) {
            setConversations([]);
        }
    };

    const fetchSearchResults = async () => {
        setLoadingResults(true);
        try {
            if (isDoctor) {
                const res = await patientAPI.getAll();
                setSearchResults(res.data.data || []);
            } else {
                const res = await doctorAPI.getAll();
                setSearchResults(res.data.data || []);
            }
        } catch (err) {
            setSearchResults([]);
            toast.error('Failed to load contacts');
        }
        setLoadingResults(false);
    };

    const openSearchModal = () => {
        setShowSearchModal(true);
        setModalSearchQuery('');
        fetchSearchResults();
    };

    // Patient messages a doctor
    const startConversationWithDoctor = async (doctor) => {
        const doctorUserId = doctor.userId._id;
        const doctorName = doctor.userId.name;

        const patientName = user?.name || 'Patient';
        const patientAddress = formatAddress(patientProfile?.address);
        const patientPhone = user?.phone || '';

        const introMessage = `Hello Dr. ${doctorName.replace('Dr. ', '')}, I am ${patientName}.\n📍 Address: ${patientAddress}\n📱 Phone: ${patientPhone}\n\nI would like to consult with you.`;

        try {
            await messageAPI.send({ receiverId: doctorUserId, content: introMessage });
            toast.success(`Message sent to ${doctorName}!`);
            fetchConversations();
        } catch (err) {
            const newConv = {
                _id: `conv_${Date.now()}`,
                lastMessage: {
                    content: introMessage,
                    createdAt: new Date(),
                    senderId: { _id: user?.id, name: user?.name },
                    receiverId: { _id: doctorUserId, name: doctorName, role: 'doctor' }
                },
                unreadCount: 0
            };
            setConversations(prev => [newConv, ...prev]);
            setSelectedConv(newConv);
            setMessages([{ _id: `m${Date.now()}`, content: introMessage, senderId: { _id: user?.id }, createdAt: new Date() }]);
            toast.success(`Conversation started with ${doctorName}!`);
        }
        setShowSearchModal(false);
    };

    // Doctor messages a patient
    const startConversationWithPatient = async (patient) => {
        const patientUserId = patient.userId._id;
        const patientName = patient.userId.name;
        const patientAddress = formatAddress(patient.address);
        const patientPhone = patient.userId.phone || '';

        const introMessage = `Hello ${patientName}, this is ${user?.name}.\n\nPatient Details:\n👤 Name: ${patientName}\n📍 Address: ${patientAddress}\n📱 Phone: ${patientPhone}\n\nHow can I help you today?`;

        try {
            await messageAPI.send({ receiverId: patientUserId, content: introMessage });
            toast.success(`Message sent to ${patientName}!`);
            fetchConversations();
        } catch (err) {
            const newConv = {
                _id: `conv_${Date.now()}`,
                lastMessage: {
                    content: introMessage,
                    createdAt: new Date(),
                    senderId: { _id: user?.id, name: user?.name },
                    receiverId: { _id: patientUserId, name: patientName, role: 'patient' }
                },
                unreadCount: 0
            };
            setConversations(prev => [newConv, ...prev]);
            setSelectedConv(newConv);
            setMessages([{ _id: `m${Date.now()}`, content: introMessage, senderId: { _id: user?.id }, createdAt: new Date() }]);
            toast.success(`Conversation started with ${patientName}!`);
        }
        setShowSearchModal(false);
    };

    const callUser = (person) => {
        const phone = person.userId?.phone;
        if (phone) {
            window.open(`tel:${phone.replace(/\s/g, '')}`);
            toast.success(`Calling ${person.userId.name}...`);
        } else {
            toast.error('Phone number not available');
        }
    };

    const selectConversation = async (conv) => {
        setSelectedConv(conv);
        try {
            const res = await messageAPI.getMessages(conv._id);
            setMessages(res.data.data || []);
        } catch {
            // Show only the last message from conversation list if full fetch fails
            setMessages(conv.lastMessage ? [{ ...conv.lastMessage, _id: conv._id }] : []);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConv) return;
        const otherUser = getOtherUser(selectedConv);

        const msg = {
            _id: `m${Date.now()}`,
            content: newMessage,
            senderId: { _id: user?.id },
            createdAt: new Date()
        };

        try {
            await messageAPI.send({ receiverId: otherUser._id, content: newMessage });
        } catch {
            // Continue with mock
        }

        setMessages(prev => [...prev, msg]);
        setNewMessage('');
    };

    const getOtherUser = (conv) => {
        if (!conv?.lastMessage) return { name: 'Unknown', role: '' };
        return conv.lastMessage.senderId._id === user?.id ? conv.lastMessage.receiverId : conv.lastMessage.senderId;
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const diff = Date.now() - d.getTime();
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return d.toLocaleTimeString('en', { timeStyle: 'short' });
        return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    // Filter search results
    const filteredResults = searchResults.filter(item => {
        const name = item.userId?.name?.toLowerCase() || '';
        const extra = isDoctor
            ? formatAddress(item.address).toLowerCase()
            : (item.specialization?.toLowerCase() || '');
        return name.includes(modalSearchQuery.toLowerCase()) || extra.includes(modalSearchQuery.toLowerCase());
    });

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const other = getOtherUser(conv);
        return other.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const searchLabel = isDoctor ? 'Find a Patient' : 'Find a Doctor';
    const searchEmoji = isDoctor ? '🔍' : '🔍';

    return (
        <div className="messages-page">
            {/* Conversations List */}
            <div className="conversations-panel">
                <div className="conversations-header">
                    <h2>Messages</h2>
                    <button className="find-doctor-btn" onClick={openSearchModal} title={searchLabel}>
                        <HiOutlineUserAdd className="w-5 h-5" />
                    </button>
                </div>
                <div className="conversations-search">
                    <HiOutlineSearch className="search-icon" />
                    <input type="text" placeholder="Search conversations..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="conversations-list">
                    {filteredConversations.map(conv => {
                        const other = getOtherUser(conv);
                        return (
                            <div key={conv._id}
                                className={`conversation-item ${selectedConv?._id === conv._id ? 'active' : ''}`}
                                onClick={() => selectConversation(conv)}>
                                <div className="conv-avatar">
                                    {other.name?.charAt(0) || '?'}
                                </div>
                                <div className="conv-info">
                                    <div className="conv-name-row">
                                        <span className="conv-name">{other.name}</span>
                                        <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                                    </div>
                                    <div className="conv-preview-row">
                                        <p className="conv-preview">{conv.lastMessage.content}</p>
                                        {conv.unreadCount > 0 && (
                                            <span className="conv-badge">{conv.unreadCount}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-panel">
                {selectedConv ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-user">
                                <div className="chat-avatar">{getOtherUser(selectedConv).name?.charAt(0)}</div>
                                <div>
                                    <h3>{getOtherUser(selectedConv).name}</h3>
                                    <span className="online-status">
                                        ● Online
                                        {getOtherUser(selectedConv).address && ` • ${formatAddress(getOtherUser(selectedConv).address)}`}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                <button className="icon-btn" title="Phone Call">
                                    <HiOutlinePhone className="w-5 h-5" />
                                </button>
                                <button className="icon-btn" title="Video Call">📹</button>
                                <button className="icon-btn" title="More"><HiOutlineDotsVertical /></button>
                            </div>
                        </div>
                        <div className="chat-messages">
                            {messages.map(msg => (
                                <div key={msg._id} className={`message-bubble ${msg.senderId._id === user?.id ? 'sent' : 'received'}`}>
                                    <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <button className="icon-btn attach-btn">
                                <HiOutlinePaperClip className="w-5 h-5" />
                            </button>
                            <input type="text" className="chat-input" placeholder="Type a message..."
                                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                            <button className="send-btn" onClick={sendMessage} disabled={!newMessage.trim()}>
                                <HiOutlinePaperAirplane className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">💬</div>
                        <h3>Select a conversation</h3>
                        <p>Choose a conversation or {isDoctor ? 'find a patient' : 'find a doctor'} to start messaging</p>
                        <button className="btn-primary" onClick={openSearchModal} style={{ marginTop: '1rem' }}>
                            <HiOutlineUserAdd className="w-5 h-5" style={{ marginRight: '0.5rem', display: 'inline' }} />
                            {searchLabel}
                        </button>
                    </div>
                )}
            </div>

            {/* Search Modal — shows Doctors for patients, Patients for doctors */}
            {showSearchModal && (
                <div className="doctor-search-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="doctor-search-modal" onClick={e => e.stopPropagation()}>
                        <div className="doctor-search-header">
                            <h2>{searchEmoji} {searchLabel}</h2>
                            <button className="icon-btn" onClick={() => setShowSearchModal(false)}>
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="doctor-search-input-wrap">
                            <HiOutlineSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder={isDoctor ? 'Search by patient name or address...' : 'Search by name or specialization...'}
                                value={modalSearchQuery}
                                onChange={e => setModalSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="doctor-search-results">
                            {loadingResults ? (
                                <div className="doctor-search-loading">
                                    <div className="spinner-sm"></div>
                                    <p>Loading {isDoctor ? 'patients' : 'doctors'}...</p>
                                </div>
                            ) : filteredResults.length === 0 ? (
                                <div className="doctor-search-empty">
                                    <p>No {isDoctor ? 'patients' : 'doctors'} found matching "{modalSearchQuery}"</p>
                                </div>
                            ) : (
                                filteredResults.map(item => (
                                    <div key={item._id} className="doctor-search-card">
                                        <div className={`doctor-search-avatar ${isDoctor ? 'patient-avatar' : ''}`}>
                                            {item.userId?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="doctor-search-info">
                                            <h4>{item.userId?.name}</h4>
                                            {isDoctor ? (
                                                <>
                                                    <p className="doctor-search-spec">
                                                        📍 {formatAddress(item.address)}
                                                    </p>
                                                    <div className="doctor-search-meta">
                                                        <span>📱 {item.userId?.phone || 'No phone'}</span>
                                                        {item.bloodGroup && <span>🩸 {item.bloodGroup}</span>}
                                                        {item.dateOfBirth && <span>🎂 {new Date(item.dateOfBirth).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="doctor-search-spec">{item.specialization}</p>
                                                    <div className="doctor-search-meta">
                                                        <span>🏥 {item.experience || 0} yrs experience</span>
                                                        <span className={`doctor-avail ${item.isAvailable ? 'available' : 'unavailable'}`}>
                                                            {item.isAvailable ? '● Available' : '○ Unavailable'}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="doctor-search-actions">
                                            <button
                                                className="doctor-action-btn message-action"
                                                onClick={() => isDoctor ? startConversationWithPatient(item) : startConversationWithDoctor(item)}
                                                title="Send Message"
                                            >
                                                💬 Message
                                            </button>
                                            <button
                                                className="doctor-action-btn call-action"
                                                onClick={() => callUser(item)}
                                                title={isDoctor ? 'Call Patient' : 'Call Doctor'}
                                            >
                                                📞 Call
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
