import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    HiOutlineMicrophone, HiOutlineVideoCamera,
    HiOutlinePhone, HiOutlineChat
} from 'react-icons/hi';
import AgoraRTC from "agora-rtc-sdk-ng";
import { agoraAPI } from '../services/api';

const AGORA_APP_ID = '7ce1c3838fcb4c2cae0b2510fc1d0a7d';

const VideoConsultation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { channelName, remoteUserName } = location.state || {};

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isCallActive, setIsCallActive] = useState(true);
    const [remoteLeft, setRemoteLeft] = useState(false);
    const [callStatus, setCallStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'

    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newChat, setNewChat] = useState('');
    const [users, setUsers] = useState([]);

    const clientRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const localVideoTrackRef = useRef(null);
    const localVideoContainerRef = useRef(null);
    const mountedRef = useRef(true);

    const cleanup = useCallback(() => {
        localAudioTrackRef.current?.close();
        localAudioTrackRef.current = null;
        localVideoTrackRef.current?.close();
        localVideoTrackRef.current = null;
        if (clientRef.current) {
            clientRef.current.removeAllListeners();
            clientRef.current.leave().catch(() => { });
            clientRef.current = null;
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        if (!channelName) {
            setCallStatus('error');
            return;
        }

        if (!isCallActive) return;

        let localClient = null;
        let localAudio = null;
        let localVideo = null;

        const initAgora = async () => {
            try {
                // Fetch Token
                const res = await agoraAPI.getToken({
                    channelName,
                    uid: 0,
                    role: 'publisher'
                });
                if (!mountedRef.current) return; // Component unmounted during fetch
                const token = res.data.token;

                // Init Client
                localClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                clientRef.current = localClient;

                localClient.on("user-published", async (user, mediaType) => {
                    if (!mountedRef.current) return;
                    await localClient.subscribe(user, mediaType);

                    if (mediaType === "audio") {
                        user.audioTrack?.play();
                    }
                    if (mediaType === "video") {
                        setUsers(prev => {
                            const exists = prev.find(u => u.uid === user.uid);
                            if (exists) return prev.map(u => u.uid === user.uid ? user : u);
                            return [...prev, user];
                        });
                    }
                });

                localClient.on("user-unpublished", (user, mediaType) => {
                    if (!mountedRef.current) return;
                    if (mediaType === "video") {
                        setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, videoTrack: undefined } : u));
                    }
                });

                localClient.on("user-left", (user) => {
                    if (!mountedRef.current) return;
                    setUsers(prev => prev.filter(u => u.uid !== user.uid));
                    setRemoteLeft(true);
                    // Auto-end after 3s
                    setTimeout(() => {
                        if (mountedRef.current) {
                            cleanup();
                            setIsCallActive(false);
                        }
                    }, 3000);
                });

                // Join Channel
                await localClient.join(AGORA_APP_ID, channelName, token, null);
                if (!mountedRef.current) {
                    // Unmounted during join — clean up
                    localClient.leave().catch(() => { });
                    return;
                }

                // Create & Publish Local Tracks
                [localAudio, localVideo] = await AgoraRTC.createMicrophoneAndCameraTracks();
                if (!mountedRef.current) {
                    localAudio?.close();
                    localVideo?.close();
                    localClient.leave().catch(() => { });
                    return;
                }

                localAudioTrackRef.current = localAudio;
                localVideoTrackRef.current = localVideo;

                if (localVideoContainerRef.current) {
                    localVideo.play(localVideoContainerRef.current);
                }

                await localClient.publish([localAudio, localVideo]);
                if (mountedRef.current) {
                    setCallStatus('connected');
                }
            } catch (err) {
                console.error('Agora init error:', err);
                if (mountedRef.current) {
                    setCallStatus('error');
                }
            }
        };

        initAgora();

        return () => {
            mountedRef.current = false;
            // Clean up tracks created in this effect
            localAudio?.close();
            localVideo?.close();
            if (localClient) {
                localClient.removeAllListeners();
                localClient.leave().catch(() => { });
            }
            localAudioTrackRef.current = null;
            localVideoTrackRef.current = null;
            clientRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelName, isCallActive]);

    // Play remote video tracks when users change
    useEffect(() => {
        const timer = setTimeout(() => {
            users.forEach(user => {
                if (user.videoTrack) {
                    const el = document.getElementById(`remote-video-${user.uid}`);
                    if (el) user.videoTrack.play(el);
                }
            });
        }, 100);
        return () => clearTimeout(timer);
    }, [users]);

    const toggleMic = () => {
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrackRef.current) {
            localVideoTrackRef.current.setMuted(!isVideoOn);
            setIsVideoOn(!isVideoOn);
        }
    };

    const handleEndCall = () => {
        cleanup();
        setIsCallActive(false);
    };

    const sendChatMessage = () => {
        if (!newChat.trim()) return;
        setChatMessages(prev => [...prev, {
            id: Date.now(), text: newChat, sender: 'me',
            time: new Date().toLocaleTimeString('en', { timeStyle: 'short' })
        }]);
        setNewChat('');
    };

    /* ——— Error State ——— */
    if (callStatus === 'error' || !channelName) {
        return (
            <div className="video-ended">
                <div className="video-ended-card">
                    <h2>Error joining call</h2>
                    <p>Invalid call link or failed to generate security token.</p>
                    <button className="btn-secondary" onClick={() => navigate('/appointments')}>Back to Appointments</button>
                </div>
            </div>
        );
    }

    /* ——— Call Ended State ——— */
    if (!isCallActive) {
        return (
            <div className="video-ended">
                <div className="video-ended-card">
                    <div className="video-ended-icon">📞</div>
                    <h2>Call Ended</h2>
                    <div className="video-ended-actions">
                        <button className="btn-primary" onClick={() => navigate('/appointments')}>Back to Appointments</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="video-consultation">
            {/* Remote Left Banner */}
            {remoteLeft && users.length === 0 && (
                <div style={{
                    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 50, background: '#ef4444', color: '#fff', padding: '8px 24px',
                    borderRadius: 8, fontWeight: 600, fontSize: 14
                }}>
                    {remoteUserName || 'The other participant'} has left the call
                </div>
            )}

            <div className={`video-main ${chatOpen ? 'with-chat' : ''}`}>
                <div className="video-container">

                    {/* Remote Videos (main) */}
                    <div className="video-feed main-feed" style={{ backgroundColor: '#1f2937' }}>
                        {users.map((user) => (
                            <div
                                key={user.uid}
                                id={`remote-video-${user.uid}`}
                                style={{ width: '100%', height: '100%' }}
                            />
                        ))}
                        {users.length === 0 && (
                            <div className="video-placeholder">
                                <p className="video-name">
                                    {remoteLeft ? `${remoteUserName || 'User'} left the call` : 'Waiting for others to join...'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Self Video (picture-in-picture) */}
                    <div className="video-feed self-feed" style={{ backgroundColor: '#374151', overflow: 'hidden' }}>
                        <div
                            ref={localVideoContainerRef}
                            style={{ width: '100%', height: '100%', display: isVideoOn ? 'block' : 'none' }}
                        />
                        {!isVideoOn && (
                            <div className="video-off">
                                <HiOutlineVideoCamera className="w-6 h-6" />
                            </div>
                        )}
                    </div>

                    {/* Call Info Bar */}
                    <div className="call-info-bar">
                        <span className="call-quality">
                            {users.length > 0 ? '🟢 Connected' : '🟡 Connecting...'}
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="video-controls">
                        <button className={`control-btn ${isMuted ? 'active-danger' : ''}`}
                            onClick={toggleMic} title={isMuted ? 'Unmute' : 'Mute'}>
                            <HiOutlineMicrophone className="w-6 h-6" />
                            {isMuted && <span className="control-slash">/</span>}
                        </button>
                        <button className={`control-btn ${!isVideoOn ? 'active-danger' : ''}`}
                            onClick={toggleVideo} title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}>
                            <HiOutlineVideoCamera className="w-6 h-6" />
                            {!isVideoOn && <span className="control-slash">/</span>}
                        </button>
                        <button className={`control-btn ${chatOpen ? 'active-primary' : ''}`}
                            onClick={() => setChatOpen(!chatOpen)} title="Chat">
                            <HiOutlineChat className="w-6 h-6" />
                        </button>
                        <button className="control-btn btn-end-call" onClick={handleEndCall} title="End Call">
                            <HiOutlinePhone className="w-6 h-6 rotate-135" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Sidebar */}
            {chatOpen && (
                <div className="video-chat-panel">
                    <div className="video-chat-header">
                        <h3>In-call Chat</h3>
                        <button onClick={() => setChatOpen(false)} className="icon-btn">✕</button>
                    </div>
                    <div className="video-chat-messages">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`video-chat-msg ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                                <p>{msg.text}</p>
                                <span>{msg.time}</span>
                            </div>
                        ))}
                    </div>
                    <div className="video-chat-input">
                        <input type="text" placeholder="Type a message..." value={newChat}
                            onChange={e => setNewChat(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendChatMessage()} />
                        <button onClick={sendChatMessage}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoConsultation;
