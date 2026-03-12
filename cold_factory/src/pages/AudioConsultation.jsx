import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineMicrophone, HiOutlinePhone } from 'react-icons/hi';
import AgoraRTC from "agora-rtc-sdk-ng";
import { agoraAPI } from '../services/api';

const AGORA_APP_ID = '7ce1c3838fcb4c2cae0b2510fc1d0a7d';

const AudioConsultation = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { channelName, remoteUserName } = location.state || {};

    const [isMuted, setIsMuted] = useState(false);
    const [isCallActive, setIsCallActive] = useState(true);
    const [users, setUsers] = useState([]);
    const [remoteLeft, setRemoteLeft] = useState(false);
    const [callStatus, setCallStatus] = useState('connecting');

    const clientRef = useRef(null);
    const localAudioTrackRef = useRef(null);
    const mountedRef = useRef(true);

    const cleanup = useCallback(() => {
        localAudioTrackRef.current?.close();
        localAudioTrackRef.current = null;
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

        const initAgora = async () => {
            try {
                const res = await agoraAPI.getToken({
                    channelName,
                    uid: 0,
                    role: 'publisher'
                });
                if (!mountedRef.current) return;
                const token = res.data.token;

                localClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                clientRef.current = localClient;

                localClient.on("user-published", async (user, mediaType) => {
                    if (!mountedRef.current) return;
                    await localClient.subscribe(user, mediaType);
                    if (mediaType === "audio") {
                        user.audioTrack?.play();
                        setUsers(prev => {
                            if (prev.find(u => u.uid === user.uid)) return prev;
                            return [...prev, user];
                        });
                    }
                });

                localClient.on("user-unpublished", (user) => {
                    if (!mountedRef.current) return;
                    setUsers(prev => prev.filter(u => u.uid !== user.uid));
                });

                localClient.on("user-left", (user) => {
                    if (!mountedRef.current) return;
                    setUsers(prev => prev.filter(u => u.uid !== user.uid));
                    setRemoteLeft(true);
                    setTimeout(() => {
                        if (mountedRef.current) {
                            cleanup();
                            setIsCallActive(false);
                        }
                    }, 3000);
                });

                await localClient.join(AGORA_APP_ID, channelName, token, null);
                if (!mountedRef.current) {
                    localClient.leave().catch(() => { });
                    return;
                }

                localAudio = await AgoraRTC.createMicrophoneAudioTrack();
                if (!mountedRef.current) {
                    localAudio?.close();
                    localClient.leave().catch(() => { });
                    return;
                }

                localAudioTrackRef.current = localAudio;
                await localClient.publish([localAudio]);
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
            localAudio?.close();
            if (localClient) {
                localClient.removeAllListeners();
                localClient.leave().catch(() => { });
            }
            localAudioTrackRef.current = null;
            clientRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelName, isCallActive]);

    const handleMute = () => {
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const handleEndCall = () => {
        cleanup();
        setIsCallActive(false);
    };

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
        <div className="video-consultation" style={{ backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>Secure Audio Call</h2>
                <p style={{ color: '#10b981', fontWeight: 600 }}>End-to-End Encrypted</p>
            </div>

            {/* Avatar Visualization */}
            <div style={{
                width: '180px', height: '180px', borderRadius: '50%',
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: users.length > 0 ? '0 0 40px rgba(14, 165, 233, 0.4)' : 'none',
                transition: 'box-shadow 0.3s ease',
                marginBottom: '30px'
            }}>
                <div style={{
                    width: '130px', height: '130px', borderRadius: '50%',
                    backgroundColor: '#0ea5e9',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: '#fff', fontSize: '48px', fontWeight: 'bold'
                }}>
                    {remoteUserName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
            </div>

            <h3 style={{ color: '#fff', fontSize: '28px', marginBottom: '10px' }}>{remoteUserName || 'Unknown User'}</h3>
            <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '50px' }}>
                {remoteLeft && users.length === 0
                    ? `${remoteUserName || 'User'} left the call`
                    : users.length === 0 ? 'Calling...' : '🟢 Connected'}
            </p>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                <button
                    className={`control-btn ${isMuted ? 'active-danger' : ''}`}
                    onClick={handleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    style={{ width: '64px', height: '64px', borderRadius: '50%' }}
                >
                    <HiOutlineMicrophone className="w-8 h-8" />
                    {isMuted && <span className="control-slash">/</span>}
                </button>

                <button
                    className="control-btn btn-end-call"
                    onClick={handleEndCall}
                    title="End Call"
                    style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#ef4444' }}
                >
                    <HiOutlinePhone className="w-8 h-8 rotate-135" color="white" />
                </button>
            </div>
        </div>
    );
};

export default AudioConsultation;
