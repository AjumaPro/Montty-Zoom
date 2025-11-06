import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  HiVideoCamera,
  HiVideoCameraSlash,
  HiMicrophone,
  HiSpeakerXMark,
  HiComputerDesktop,
  HiUserGroup,
  HiChatBubbleLeftRight,
  HiFaceSmile,
  HiHandRaised,
  HiViewColumns,
  HiSquare3Stack3D,
  HiPencilSquare,
  HiChartBar,
  HiBuildingOffice2,
  HiStopCircle,
  HiCog6Tooth,
  HiPhoneArrowUpRight,
  HiCheckCircle,
  HiPlay,
  HiStop,
  HiShieldCheck,
  HiArrowsPointingOut,
  HiArrowsPointingIn,
  HiShare,
  HiLanguage,
  HiGlobeAlt,
  HiPaperClip,
  HiMiniPresentationChartBar,
  HiMapPin
} from 'react-icons/hi2';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import SettingsPanel from '../components/SettingsPanel';
import ReactionsPanel from '../components/ReactionsPanel';
import ReactionOverlay from '../components/ReactionOverlay';
import WaitingRoomPanel from '../components/WaitingRoomPanel';
// import VirtualBackground from '../components/VirtualBackground'; // Reserved for future use
import MeetingTimer from '../components/MeetingTimer';
import VoiceActivityIndicator from '../components/VoiceActivityIndicator';
import Whiteboard from '../components/Whiteboard';
import PollsPanel from '../components/PollsPanel';
import RecordingsPanel from '../components/RecordingsPanel';
import ConnectionStatus from '../components/ConnectionStatus';
import ShareMeeting from '../components/ShareMeeting';
import StreamingPanel from '../components/StreamingPanel';
import CaptionsPanel from '../components/CaptionsPanel';
import CaptionsOverlay from '../components/CaptionsOverlay';
import MeetingLobby from '../components/MeetingLobby';
import ConnectionQuality from '../components/ConnectionQuality';
import ScreenAnnotation from '../components/ScreenAnnotation';
import FileSharePanel from '../components/FileSharePanel';
import MeetingHistory from '../components/MeetingHistory';
import NoiseSuppressionPanel from '../components/NoiseSuppressionPanel';
import TranscriptionPanel from '../components/TranscriptionPanel';
import TranslationPanel from '../components/TranslationPanel';
import BreakoutRooms from '../components/BreakoutRooms';
import UpgradePrompt from '../components/UpgradePrompt';
import UpgradeBanner from '../components/UpgradeBanner';
import { saveRecording, loadRecordings, deleteRecording as deleteRecordingFromDB } from '../utils/recordingStorage';
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures';
import { translationService } from '../utils/translationService';
import './Room.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RemoteVideo = ({ stream, userName, userId = '', isLocal = false, onMaximize, onMinimize, isMaximized = false, isMinimized = false, onPin, isPinned = false }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideControlsTimeoutRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      // Set srcObject
      videoElement.srcObject = stream;
      
      // Ensure video plays immediately
      const playVideo = async () => {
        try {
          // Check if video tracks are available
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            console.log('Video track found:', videoTracks[0].label, 'enabled:', videoTracks[0].enabled);
            videoTracks[0].enabled = true;
          }
          
          // Ensure video element is visible
          videoElement.style.opacity = '1';
          videoElement.style.display = 'block';
          
          await videoElement.play();
          console.log('Video playing successfully');
        } catch (error) {
          console.warn('Initial video play failed, waiting for metadata:', error);
          
          // Video might not be ready yet, try again after metadata loads
          const handleLoadedMetadata = async () => {
            try {
              const videoTracks = stream.getVideoTracks();
              if (videoTracks.length > 0) {
                videoTracks[0].enabled = true;
              }
              videoElement.style.opacity = '1';
              videoElement.style.display = 'block';
              await videoElement.play();
              console.log('Video playing after metadata loaded');
            } catch (playError) {
              console.error('Video play failed after metadata:', playError);
            }
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
          
          // Also listen for loadeddata event
          const handleLoadedData = async () => {
            try {
              await videoElement.play();
              console.log('Video playing after data loaded');
            } catch (playError) {
              console.error('Video play failed after data loaded:', playError);
            }
            videoElement.removeEventListener('loadeddata', handleLoadedData);
          };
          
          videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.addEventListener('loadeddata', handleLoadedData);
        }
      };
      
      playVideo();
      
      // Monitor track events
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.onunmute = () => {
          console.log('Video track unmuted');
          if (videoElement) {
            videoElement.style.opacity = '1';
            videoElement.play().catch(err => console.warn('Auto-play failed:', err));
          }
        };
        track.onmute = () => {
          console.log('Video track muted');
        };
      });
    }
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle mouse movement to show/hide controls in fullscreen
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    
    if (!container || !video) return;

    const showControls = () => {
      if (controlsRef.current) {
        controlsRef.current.style.opacity = '1';
        controlsRef.current.style.pointerEvents = 'auto';
      }
      
      // Clear existing timeout
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      // Hide controls after 3 seconds of no movement
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (controlsRef.current) {
          controlsRef.current.style.opacity = '0';
          controlsRef.current.style.pointerEvents = 'none';
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      if (isFullscreen || isMaximized) {
        showControls();
      }
    };

    const handleMouseEnter = () => {
      showControls();
    };

    const handleMouseLeave = () => {
      if (isFullscreen || isMaximized) {
        // Only hide after delay in fullscreen
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
        hideControlsTimeoutRef.current = setTimeout(() => {
          if (controlsRef.current) {
            controlsRef.current.style.opacity = '0';
            controlsRef.current.style.pointerEvents = 'none';
          }
        }, 2000);
      } else {
        if (controlsRef.current) {
          controlsRef.current.style.opacity = '0';
          controlsRef.current.style.pointerEvents = 'none';
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    // Also listen on video element for fullscreen
    video.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      video.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isFullscreen, isMaximized]);

  const handleMaximize = (e) => {
    e.stopPropagation();
    if (onMaximize) onMaximize(userId);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    if (onMinimize) onMinimize(userId);
  };

  const handleFullscreen = async (e) => {
    e.stopPropagation();
    const element = containerRef.current;
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Fullscreen not supported or denied');
    }
  };

  const handleRestore = (e) => {
    e.stopPropagation();
    if (isMaximized && onMaximize) {
      onMaximize(null);
    }
    if (isMinimized && onMinimize) {
      onMinimize(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`remote-video-container ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="remote-video"
        style={{ opacity: 1, display: 'block' }}
      />
      <VoiceActivityIndicator stream={stream} userId={userId} isLocal={isLocal} />
      <div className="video-label">{userName}</div>
      <div className="video-controls" ref={controlsRef}>
        {!isMaximized && !isMinimized && (
          <>
            <button 
              className="video-control-btn" 
              onClick={handleMaximize}
              title="Maximize"
            >
              <HiArrowsPointingOut />
            </button>
            {onPin && (
              <button 
                className={`video-control-btn ${isPinned ? 'pinned' : ''}`}
                onClick={() => onPin(userId)}
                title={isPinned ? "Unpin" : "Pin participant"}
              >
                <HiMapPin />
              </button>
            )}
            <button 
              className="video-control-btn" 
              onClick={handleMinimize}
              title="Minimize"
            >
              <HiArrowsPointingIn />
            </button>
            <button 
              className="video-control-btn" 
              onClick={handleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <HiArrowsPointingIn /> : <HiArrowsPointingOut />}
            </button>
          </>
        )}
        {(isMaximized || isMinimized) && (
          <button 
            className="video-control-btn" 
            onClick={handleRestore}
            title="Restore"
          >
            <HiArrowsPointingIn />
          </button>
        )}
        {!isMinimized && (
          <button 
            className="video-control-btn" 
            onClick={handleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <HiArrowsPointingIn /> : <HiArrowsPointingOut />}
          </button>
        )}
      </div>
    </div>
  );
};

function Room() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const userName = searchParams.get('name') || 'Anonymous';
  const navigate = useNavigate();
  const skipLobby = searchParams.get('skipLobby') === 'true';

  // Subscription features hook
  const {
    subscription,
    canPerform,
    requireFeature,
    trackMinutes,
    checkMinutes
  } = useSubscriptionFeatures();

  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [remoteUserNames, setRemoteUserNames] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [isHost, setIsHost] = useState(false);
  const [isMainHost, setIsMainHost] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [mainHost, setMainHost] = useState(null);
  const [moderators, setModerators] = useState([]);
  const [hostName, setHostName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  // const [recordedChunks, setRecordedChunks] = useState([]); // Reserved for future enhancement
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'speaker'
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [displayedCaptions, setDisplayedCaptions] = useState([]); // Captions from all participants
  const [currentCaptionText, setCurrentCaptionText] = useState('');
  const [captionTranslations, setCaptionTranslations] = useState({}); // { captionId: { lang: text } }
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);
  const [pinnedParticipant, setPinnedParticipant] = useState(null);
  const [showScreenAnnotation, setShowScreenAnnotation] = useState(false);
  const [showFileShare, setShowFileShare] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showMeetingHistory, setShowMeetingHistory] = useState(false);
  const [showNoiseSuppression, setShowNoiseSuppression] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationSettings, setTranslationSettings] = useState({
    enabled: false,
    targetLanguages: ['es'],
    sourceLanguage: 'auto'
  });
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptFeature, setUpgradePromptFeature] = useState('');
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [lobbyMediaSettings, setLobbyMediaSettings] = useState({ videoEnabled: true, audioEnabled: true });
  const [streamRecordingRef, setStreamRecordingRef] = useState(null);
  const [isRecordingStream, setIsRecordingStream] = useState(false);
  const [showRecordings, setShowRecordings] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [meetingStartedAt, setMeetingStartedAt] = useState(null);
  const meetingStartTimeRef = useRef(null);
  const [meetingStatus, setMeetingStatus] = useState('waiting'); // 'waiting', 'started', 'ended'
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketReconnectAttempts, setSocketReconnectAttempts] = useState(0);
  const [maximizedVideo, setMaximizedVideo] = useState(null); // userId of maximized video
  const [minimizedVideos, setMinimizedVideos] = useState(new Set()); // Set of minimized video userIds
  const [showShareMeeting, setShowShareMeeting] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const screenShareParamRef = useRef(false); // Track screen share parameter

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(new Map());
  const peersRef = useRef(new Map());
  const socketRef = useRef(null);
  const userIdRef = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const localStreamRef = useRef(null); // Ref to track local stream for cleanup
  const screenStreamRef = useRef(null); // Ref to track screen stream for cleanup
  const isMainHostRef = useRef(false); // Ref to track main host status
  const isModeratorRef = useRef(false); // Ref to track moderator status
  const mainHostRef = useRef(null); // Ref to track main host ID
  const moderatorsRef = useRef([]); // Ref to track moderators list

  // Show upgrade banner for free plan users
  useEffect(() => {
    if (subscription && subscription.planId === 'free') {
      setShowUpgradeBanner(true);
    } else {
      setShowUpgradeBanner(false);
    }
  }, [subscription]);

  useEffect(() => {
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });
    
    setSocket(newSocket);
    socketRef.current = newSocket;
    
    // Connection status handlers
    newSocket.on('connect', () => {
      setSocketConnected(true);
      setSocketReconnectAttempts(0);
      toast.success('Connected to server');
    });
    
    newSocket.on('disconnect', (reason) => {
      setSocketConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      } else {
        toast.warning('Disconnected from server. Reconnecting...');
      }
    });
    
    newSocket.on('connect_error', (error) => {
      setSocketConnected(false);
      setSocketReconnectAttempts(prev => prev + 1);
      if (socketReconnectAttempts >= 4) {
        toast.error('Connection error. Please check your internet connection.');
      }
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      setSocketConnected(true);
      setSocketReconnectAttempts(0);
      toast.success('Reconnected to server');
    });
    
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setSocketReconnectAttempts(attemptNumber);
    });
    
    newSocket.on('reconnect_failed', () => {
      setSocketConnected(false);
      toast.error('Failed to reconnect. Please refresh the page.');
    });
    
    // Capture refs and state for cleanup
    const currentPeers = peersRef.current;
    const currentLocalVideoRef = localVideoRef.current;
    const currentRemoteVideosRef = remoteVideosRef.current;
    const currentUserId = userIdRef.current;
    const currentRoomId = roomId;

    // Show lobby on first mount (unless skipped)
    if (!skipLobby) {
      setShowLobby(true);
    } else {
    initializeMedia();
    }
    
    // Handle page unload (browser close, refresh, navigation)
    // This ensures camera is stopped even if user closes tab/window
    const handleBeforeUnload = () => {
      // Stop all media tracks immediately - this is critical for camera cleanup
      // Use refs to get current values (refs persist even after component unmounts)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
            track.enabled = false;
          } catch (err) {
            console.error('Error stopping local track:', err);
          }
        });
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
            track.enabled = false;
          } catch (err) {
            console.error('Error stopping screen track:', err);
          }
        });
      }
      
      // Try to notify server, but don't block if it fails
      try {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('leave-room', { roomId: currentRoomId, userId: currentUserId });
        }
      } catch (err) {
        console.error('Error notifying server on unload:', err);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    newSocket.on('connect', () => {
      const password = searchParams.get('password');
      setRoomPassword(password || ''); // Store password from URL
      newSocket.emit('join-room', {
        roomId,
        userId: userIdRef.current,
        userName,
        password
      });
    });

    // Auto-start meeting if requested via URL parameter
    const autoStartParam = searchParams.get('autoStart') === 'true';
    screenShareParamRef.current = searchParams.get('screenShare') === 'true';
    if (autoStartParam) {
      // Wait for room-info to confirm we're the host, then auto-start
      const autoStartHandler = (data) => {
        if (data.isMainHost && data.meetingStatus === 'waiting') {
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.emit('start-meeting', {
                roomId,
                userId: userIdRef.current
              });
            }
          }, 1500); // Give time for connection to establish
          newSocket.off('room-info', autoStartHandler);
        }
      };
      newSocket.on('room-info', autoStartHandler);
    }

    newSocket.on('room-error', (data) => {
      toast.error(data.message);
      if (data.message === 'Incorrect password' || data.message === 'Room not found') {
        navigate('/');
      }
    });

    newSocket.on('waiting-room', () => {
      setIsInWaitingRoom(true);
      toast.info('Waiting for host approval');
    });

    newSocket.on('approved-to-join', () => {
      setIsInWaitingRoom(false);
      toast.success('Approved to join meeting');
      initializeMedia();
    });

    newSocket.on('rejected-from-room', () => {
      toast.error('Access denied by host');
      navigate('/');
    });

    newSocket.on('reaction', (data) => {
      setCurrentReaction({ emoji: data.reaction, userName: data.userName });
      setTimeout(() => setCurrentReaction(null), 3000);
    });

    newSocket.on('hand-raised', (data) => {
      if (data.userId !== userIdRef.current) {
        toast.info(`${data.userName} raised their hand`);
      }
    });

    newSocket.on('hand-lowered', (data) => {
      // Handle hand lowered
    });

    newSocket.on('waiting-room-request', (user) => {
      setWaitingUsers(prev => {
        // Avoid duplicates
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
      
      // Auto-open waiting room panel for hosts/moderators
      // Use refs for immediate check, fallback to state
      const isHost = isMainHostRef.current || isModeratorRef.current || 
                     (mainHostRef.current === userIdRef.current) ||
                     (moderatorsRef.current.includes(userIdRef.current));
      
      if (isHost || isMainHost || isModerator) {
        setShowWaitingRoom(true);
        toast.info(`${user.userName} is waiting to join`, {
          onClick: () => setShowWaitingRoom(true),
          autoClose: 5000
        });
      }
    });

    newSocket.on('waiting-room-updated', (users) => {
      setWaitingUsers(users);
    });

    newSocket.on('existing-users', (users) => {
      console.log('Received existing users:', users);
      users.forEach((user) => {
        createPeerConnection(user.id, true, user.userName);
        // Update host name if found in existing users
        if (user.id === mainHost || user.isMainHost) {
          setHostName(user.userName);
        }
      });
      if (users.length > 0 && meetingStatus === 'started') {
        toast.success(`Connected to ${users.length} participant${users.length !== 1 ? 's' : ''}`);
      }
    });

    newSocket.on('user-joined', (user) => {
      createPeerConnection(user.id, false, user.userName);
      // Update host name if the joined user is the host
      if (user.id === mainHost || user.isMainHost) {
        setHostName(user.userName);
      }
      setParticipants(prev => [...prev, user]);
      setRemoteUserNames(prev => {
        const newMap = new Map(prev);
        newMap.set(user.id, user.userName);
        return newMap;
      });
      if (user.id !== userIdRef.current) {
        toast.info(`${user.userName} joined the meeting`);
      }
    });

    newSocket.on('offer', async (data) => {
      const peerConnection = peersRef.current.get(data.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        newSocket.emit('answer', {
          roomId,
          answer,
          userId: userIdRef.current
        });
      }
    });

    newSocket.on('answer', async (data) => {
      const peerConnection = peersRef.current.get(data.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    newSocket.on('ice-candidate', async (data) => {
      const peerConnection = peersRef.current.get(data.from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    newSocket.on('user-left', (data) => {
      if (data.userId !== userIdRef.current) {
        setRemoteStreams(prev => {
          const newStreams = new Map(prev);
          newStreams.delete(data.userId);
          return newStreams;
        });
        setRemoteUserNames(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
        setParticipants(prev => prev.filter(p => p.id !== data.userId));
        
        // Close peer connection
        const peerConnection = peersRef.current.get(data.userId);
        if (peerConnection) {
          peerConnection.close();
          peersRef.current.delete(data.userId);
        }
        
        // Remove video ref
        remoteVideosRef.current.delete(data.userId);
        
        if (data.wasMainHost) {
          toast.warning('Host left the meeting');
        } else {
          toast.info('Participant left the meeting');
        }
      }
    });

    newSocket.on('host-changed', (data) => {
      if (data.newHost === userIdRef.current) {
        setIsMainHost(true);
        setIsHost(true);
        isMainHostRef.current = true;
        toast.success(`You are now the host! ${data.reason || ''}`);
      } else if (data.previousHost === userIdRef.current) {
        setIsMainHost(false);
        setIsHost(false);
        isMainHostRef.current = false;
        toast.info(`Host transferred to ${data.newHostName || 'another participant'}`);
      } else {
        toast.info(`Host changed: ${data.newHostName || 'Unknown'} is now the host`);
      }
      
      // Update main host state
      setMainHost(data.newHost);
      mainHostRef.current = data.newHost;
      
      // Update host name
      if (data.newHostName) {
        setHostName(data.newHostName);
      }
    });

    newSocket.on('recording-started', () => {
      setIsRecording(true);
      toast.info('Recording started');
    });

    newSocket.on('recording-stopped', () => {
      setIsRecording(false);
      toast.info('Recording stopped');
    });

    newSocket.on('streaming-started', (data) => {
      setIsStreaming(true);
      toast.success(`Live streaming started to ${data.platform || 'platform'}!`);
      
      // Start recording if requested
      if (data.recordWhileStreaming) {
        startStreamRecording();
      }
    });

    newSocket.on('streaming-stopped', () => {
      setIsStreaming(false);
      // Stop recording if it was recording during streaming
      if (streamRecordingRef.current) {
        stopStreamRecording();
      }
      toast.info('Live streaming stopped');
    });

    newSocket.on('caption', async (data) => {
      // Receive caption from another participant
      if (data.text && data.userName) {
        const captionId = `${data.userId}-${Date.now()}`;
        const caption = {
          id: captionId,
          text: data.text,
          userName: data.userName,
          userId: data.userId,
          timestamp: data.timestamp || Date.now()
        };
        setDisplayedCaptions(prev => [...prev.slice(-5), caption]);
        setCurrentCaptionText(data.text);
        
        // Auto-translate if translation is enabled
        if (translationSettings.enabled && translationSettings.targetLanguages && translationSettings.targetLanguages.length > 0) {
          translateCaption(data.text, captionId);
        }
        
        // Clear caption after 5 seconds
        setTimeout(() => {
          setCurrentCaptionText(prev => prev === data.text ? '' : prev);
          setCaptionTranslations(prev => {
            const newTranslations = { ...prev };
            delete newTranslations[captionId];
            return newTranslations;
          });
        }, 5000);
      }
    });

    newSocket.on('translation', (data) => {
      // Receive translation from another participant
      if (data.originalText && data.translations) {
        // Find matching caption and add translations
        setDisplayedCaptions(prev => {
          const updated = [...prev];
          const matchingCaption = updated.find(c => c.text === data.originalText);
          if (matchingCaption) {
            setCaptionTranslations(prevTrans => ({
              ...prevTrans,
              [matchingCaption.id]: data.translations
            }));
          }
          return updated;
        });
      }
    });

    newSocket.on('caption-started', (data) => {
      toast.info(`${data.userName} started live captions`);
    });

    newSocket.on('caption-stopped', (data) => {
      toast.info(`${data.userName} stopped live captions`);
    });

    newSocket.on('file-shared', (data) => {
      if (data.file) {
        toast.info(`${data.userName} shared a file: ${data.file.name}`);
      }
    });

    newSocket.on('room-info', (data) => {
      setIsMainHost(data.isMainHost || data.mainHost === userIdRef.current);
      setIsModerator(data.isModerator || (data.moderators && data.moderators.includes(userIdRef.current)));
      setIsHost(data.isMainHost || data.isModerator || data.hostId === userIdRef.current);
      setMainHost(data.mainHost);
      setModerators(data.moderators || []);
      
      // Update refs for immediate access
      isMainHostRef.current = data.isMainHost || data.mainHost === userIdRef.current;
      isModeratorRef.current = data.isModerator || (data.moderators && data.moderators.includes(userIdRef.current));
      mainHostRef.current = data.mainHost;
      moderatorsRef.current = data.moderators || [];
      
      setParticipants(data.participants || []);
      if (data.meetingStatus) {
        setMeetingStatus(data.meetingStatus);
      }
      if (data.startedAt) {
        setMeetingStartedAt(data.startedAt);
      }
      // Get host name from participants
      if (data.participants && data.mainHost) {
        const hostParticipant = data.participants.find(p => p.id === data.mainHost);
        if (hostParticipant) {
          setHostName(hostParticipant.userName);
        }
      }
      // Get room password if available and not already set
      if (data.roomPassword && !roomPassword) {
        setRoomPassword(data.roomPassword);
      }
    });

    newSocket.on('meeting-started', async (data) => {
      setMeetingStatus('started');
      if (data.startedAt) {
        setMeetingStartedAt(data.startedAt);
        meetingStartTimeRef.current = new Date(data.startedAt);
      }
      toast.success('Meeting has started!');
      
      // Track meeting start - check minutes before starting
      const userId = localStorage.getItem('userId');
      if (userId) {
        const checkResult = await checkMinutes(0);
        if (!checkResult.allowed) {
          toast.error('Insufficient call minutes. Meeting will end when limit is reached.');
        }
      }
      
      // Auto-start screen sharing if requested via URL parameter
      if (screenShareParamRef.current && localStream) {
        setTimeout(() => {
          startScreenShare();
        }, 1000); // Wait a bit for the meeting to fully start
      }
    });

    newSocket.on('meeting-ended', async (data) => {
      setMeetingStatus('ended');
      toast.error(data.message || 'The meeting has ended');
      
      // Track call minutes used
      if (meetingStartTimeRef.current && subscription) {
        const endTime = new Date();
        const durationMinutes = Math.ceil((endTime - meetingStartTimeRef.current) / 60000);
        if (durationMinutes > 0 && subscription.callMinutes !== -1) {
          await trackMinutes(durationMinutes);
        }
        meetingStartTimeRef.current = null;
      }
      
      // Immediately stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      setTimeout(() => {
        leaveRoom();
      }, 3000);
    });

    newSocket.on('meeting-ended-by-host', () => {
      setMeetingStatus('ended');
      toast.error('The host has ended the meeting');
      // Immediately stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      setTimeout(() => {
        leaveRoom();
      }, 3000);
    });

    newSocket.on('start-meeting-success', async () => {
      toast.success('Meeting started successfully');
      
      // Check call minutes periodically during meeting
      const userId = localStorage.getItem('userId');
      if (userId && subscription && subscription.callMinutes !== -1) {
        // Check every 5 minutes
        const checkInterval = setInterval(async () => {
          const checkResult = await checkMinutes(0);
          if (!checkResult.allowed || (checkResult.remaining && checkResult.remaining < 10)) {
            toast.warning(`Low call minutes remaining: ${checkResult.remaining} minutes. Please upgrade to continue.`);
            if (!checkResult.allowed) {
              clearInterval(checkInterval);
              // End meeting when minutes exhausted
              setTimeout(() => {
                if (socketRef.current) {
                  socketRef.current.emit('end-meeting', { roomId, userId });
                }
              }, 60000); // Give 1 minute warning
            }
          }
        }, 5 * 60 * 1000); // Check every 5 minutes
        
        // Store interval ID for cleanup
        socketRef.current.metersCheckInterval = checkInterval;
      }
    });

    newSocket.on('meeting-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('user-promoted', (data) => {
      toast.success(`${data.userName} has been promoted to moderator`);
      // Refresh participants to show updated roles
    });

    newSocket.on('user-demoted', (data) => {
      toast.info(`${data.userName} has been demoted to participant`);
    });

    newSocket.on('promote-success', () => {
      toast.success('User promoted to moderator');
    });

    newSocket.on('promote-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('demote-success', () => {
      toast.success('Moderator demoted to participant');
    });

    newSocket.on('demote-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('mute-all-participants', () => {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsAudioEnabled(false);
          toast.warning('Host muted all participants');
        }
      }
    });

    newSocket.on('force-mute', () => {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsAudioEnabled(false);
          toast.warning('Host has muted your microphone');
        }
      }
    });

    newSocket.on('force-unmute', () => {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
          setIsAudioEnabled(true);
          toast.info('Host has unmuted your microphone');
        }
      }
    });

    newSocket.on('participant-muted', (data) => {
      setParticipants(prev => prev.map(p => 
        p.id === data.targetUserId ? { ...p, isAudioEnabled: false } : p
      ));
      if (data.targetUserId !== userIdRef.current) {
        toast.info(`${data.userName} has been muted by host`);
      }
    });

    newSocket.on('participant-unmuted', (data) => {
      setParticipants(prev => prev.map(p => 
        p.id === data.targetUserId ? { ...p, isAudioEnabled: true } : p
      ));
      if (data.targetUserId !== userIdRef.current) {
        toast.info(`${data.userName} has been unmuted by host`);
      }
    });

    newSocket.on('mute-error', (data) => {
      toast.error(data.message);
    });

    newSocket.on('kicked-from-room', () => {
      toast.error('You have been removed from the meeting');
      leaveRoom();
    });

    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        toggleAudio();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleAudio();
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        toggleVideo();
      } else if (e.code === 'KeyS' && e.shiftKey) {
        e.preventDefault();
        if (isScreenSharing) stopScreenShare();
        else startScreenShare();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      
      // Clear minutes check interval
      if (socketRef.current?.metersCheckInterval) {
        clearInterval(socketRef.current.metersCheckInterval);
      }
      
      // Comprehensive cleanup when component unmounts
      // Stop all media tracks immediately - use refs to get current values
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      
      // Stop all remote streams
      remoteStreams.forEach((stream) => {
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      });
      
      // Close all peer connections
      currentPeers.forEach((peerConnection) => {
        if (peerConnection) {
          peerConnection.getSenders().forEach(sender => {
            if (sender.track) {
              sender.track.stop();
            }
          });
          peerConnection.close();
        }
      });
      
      // Clear video refs to stop rendering
      if (currentLocalVideoRef) {
        currentLocalVideoRef.srcObject = null;
      }
      currentRemoteVideosRef.forEach((videoRef) => {
        if (videoRef && videoRef.current) {
          videoRef.current.srcObject = null;
        }
      });
      
      // Stop media recorder if active
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch (e) {
          console.error('Error stopping recorder:', e);
        }
      }
      
      // Close socket connection
      if (newSocket) {
        newSocket.emit('leave-room', { roomId: currentRoomId, userId: currentUserId });
        newSocket.close();
        newSocket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Translate caption text
  const translateCaption = async (text, captionId) => {
    if (!text || !translationSettings.enabled || !translationSettings.targetLanguages) return;

    try {
      const translations = {};
      const translatePromises = translationSettings.targetLanguages.map(async (targetLang) => {
        try {
          const result = await translationService.translate(text, targetLang, 'auto');
          return { lang: targetLang, text: result.translatedText };
        } catch (error) {
          console.error(`Translation to ${targetLang} failed:`, error);
          return null;
        }
      });

      const results = await Promise.all(translatePromises);
      results.forEach((result) => {
        if (result) {
          translations[result.lang] = result.text;
        }
      });

      if (Object.keys(translations).length > 0) {
        setCaptionTranslations(prev => ({
          ...prev,
          [captionId]: translations
        }));
      }
    } catch (error) {
      console.error('Error translating caption:', error);
    }
  };

  const getVideoConstraints = (quality) => {
    const constraints = {
      auto: { width: { ideal: 1280 }, height: { ideal: 720 } },
      low: { width: { ideal: 320 }, height: { ideal: 240 } },
      medium: { width: { ideal: 640 }, height: { ideal: 480 } },
      high: { width: { ideal: 1280 }, height: { ideal: 720 } },
      ultra: { width: { ideal: 1920 }, height: { ideal: 1080 } }
    };
    return constraints[quality] || constraints.auto;
  };

  const initializeMedia = async (quality = videoQuality) => {
    try {
      console.log('Initializing media...');
      const videoConstraints = getVideoConstraints(quality);
      console.log('Requesting media with constraints:', videoConstraints);
      
      // Use lobby settings if available
      const videoEnabled = lobbyMediaSettings?.videoEnabled !== false;
      const audioEnabled = lobbyMediaSettings?.audioEnabled !== false;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? videoConstraints : false,
        audio: audioEnabled
      });
      
      console.log('Media stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled, readyState: t.readyState })));
      console.log('Audio tracks:', stream.getAudioTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled, readyState: t.readyState })));
      
      // Ensure video track is enabled
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = true;
        setIsVideoEnabled(true);
        console.log('Video track enabled:', videoTrack.enabled);
      }
      
      // Ensure audio track is enabled
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsAudioEnabled(true);
      }
      
      setLocalStream(stream);
      localStreamRef.current = stream; // Update ref for cleanup
      
      if (localVideoRef.current) {
        console.log('Setting video srcObject...');
        localVideoRef.current.srcObject = stream;
        
        // Set up PiP event listeners
        localVideoRef.current.addEventListener('enterpictureinpicture', () => {
          setIsPiPMode(true);
        });
        
        localVideoRef.current.addEventListener('leavepictureinpicture', () => {
          setIsPiPMode(false);
        });
        
        // Ensure video element is visible
        localVideoRef.current.style.opacity = '1';
        localVideoRef.current.style.display = 'block';
        localVideoRef.current.style.visibility = 'visible';
        
        // Ensure video plays immediately
        try {
          await localVideoRef.current.play();
          console.log('Local video playing successfully');
        } catch (playError) {
          console.warn('Video play error:', playError);
          // Video will play automatically once ready
        }
        
        // Update all existing peer connections with the new stream
        peersRef.current.forEach((peerConnection) => {
          stream.getTracks().forEach(track => {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === track.kind
            );
            if (sender) {
              sender.replaceTrack(track);
            } else {
              peerConnection.addTrack(track, stream);
            }
          });
        });
      } else {
        console.warn('localVideoRef.current is null');
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone permission denied. Please allow access and refresh.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera/microphone found. Please connect a device.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/microphone is already in use by another application.');
      } else {
        toast.error(`Failed to access camera/microphone: ${error.message}`);
      }
    }
  };

  // Handle local video display
  useEffect(() => {
    const videoElement = localVideoRef.current;
    const currentStream = localStream || screenStream;
    
    console.log('Local video useEffect triggered:', { 
      hasVideoElement: !!videoElement, 
      hasLocalStream: !!localStream, 
      hasScreenStream: !!screenStream,
      currentStream: !!currentStream 
    });
    
    if (videoElement && currentStream) {
      console.log('Setting up local video element...');
      
      // Ensure video tracks are enabled before setting srcObject
      const videoTracks = currentStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = true;
        setIsVideoEnabled(true);
        console.log('Video track enabled:', videoTracks[0].enabled, videoTracks[0].label);
      }
      
      // Set srcObject
      videoElement.srcObject = currentStream;
      
      // Log stream info
      console.log('Local video tracks:', videoTracks.map(t => ({ 
        id: t.id, 
        label: t.label, 
        enabled: t.enabled, 
        readyState: t.readyState,
        muted: t.muted
      })));
      
      // Ensure video plays immediately
      const playVideo = async () => {
        try {
          // Ensure video element is visible
          videoElement.style.opacity = '1';
          videoElement.style.display = 'block';
          videoElement.style.visibility = 'visible';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          
          // Check video element state
          console.log('Video element state:', {
            srcObject: !!videoElement.srcObject,
            paused: videoElement.paused,
            readyState: videoElement.readyState,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            currentSrc: videoElement.currentSrc
          });
          
          // Force play
          videoElement.muted = true; // Ensure muted for autoplay
          await videoElement.play();
          console.log('Local video playing successfully');
        } catch (error) {
          console.warn('Initial local video play failed, waiting for metadata:', error);
          
          // Video might not be ready yet, try again after metadata loads
          const handleLoadedMetadata = async () => {
            try {
              console.log('Video metadata loaded');
              const videoTracks = currentStream.getVideoTracks();
              if (videoTracks.length > 0) {
                videoTracks[0].enabled = true;
              }
              videoElement.style.opacity = '1';
              videoElement.style.display = 'block';
              videoElement.style.visibility = 'visible';
              await videoElement.play();
              console.log('Local video playing after metadata loaded');
            } catch (playError) {
              console.error('Local video play failed after metadata:', playError);
            }
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
          
          // Also listen for loadeddata event
          const handleLoadedData = async () => {
            try {
              console.log('Video data loaded');
              await videoElement.play();
              console.log('Local video playing after data loaded');
            } catch (playError) {
              console.error('Local video play failed after data loaded:', playError);
            }
            videoElement.removeEventListener('loadeddata', handleLoadedData);
          };
          
          // Listen for canplay event
          const handleCanPlay = async () => {
            try {
              console.log('Video can play');
              await videoElement.play();
              console.log('Local video playing after canplay');
            } catch (playError) {
              console.error('Local video play failed after canplay:', playError);
            }
            videoElement.removeEventListener('canplay', handleCanPlay);
          };
          
          videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.addEventListener('loadeddata', handleLoadedData);
          videoElement.addEventListener('canplay', handleCanPlay);
        }
      };
      
      playVideo();
      
      // Monitor track events
      const tracksToMonitor = currentStream.getVideoTracks();
      tracksToMonitor.forEach(track => {
        track.onunmute = () => {
          console.log('Local video track unmuted');
          if (videoElement) {
            videoElement.style.opacity = '1';
            videoElement.play().catch(err => console.warn('Local video auto-play failed:', err));
          }
        };
        track.onmute = () => {
          console.log('Local video track muted');
        };
        track.onended = () => {
          console.log('Local video track ended');
        };
      });
    } else if (videoElement && !currentStream) {
      // Clear video if no stream
      console.log('No stream available, clearing video');
      videoElement.srcObject = null;
    }
    
    return () => {
      // Cleanup is handled by the component unmount
    };
  }, [localStream, screenStream]);

  const handleVideoQualityChange = async (quality) => {
    setVideoQuality(quality);
    if (localStream && !isScreenSharing) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const constraints = getVideoConstraints(quality);
        await videoTrack.applyConstraints(constraints);
        toast.success(`Video quality set to ${quality}`);
      }
    }
  };

  const createPeerConnection = async (remoteUserId, isInitiator, remoteUserName = null) => {
    // Get TURN server configuration from environment or use defaults
    const turnServers = process.env.REACT_APP_TURN_SERVERS 
      ? JSON.parse(process.env.REACT_APP_TURN_SERVERS)
      : [];
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        ...turnServers.map(server => ({
          urls: server.url,
          username: server.username || undefined,
          credential: server.credential || undefined
        }))
      ],
      iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peersRef.current.set(remoteUserId, peerConnection);

    // Add tracks when localStream is available
    const addLocalTracks = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }
    };
    
    // Try to add tracks immediately, or wait for stream
    if (localStreamRef.current) {
      addLocalTracks();
    } else {
      // Check more frequently for localStream to reduce delay
      let attempts = 0;
      const maxAttempts = 10; // Check up to 10 times (5 seconds max)
      const checkInterval = setInterval(() => {
        attempts++;
        if (localStreamRef.current) {
        addLocalTracks();
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
        }
      }, 500); // Check every 500ms instead of waiting 1000ms
    }

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      // Update streams immediately
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(remoteUserId, remoteStream);
        return newMap;
      });
      if (remoteUserName) {
        setRemoteUserNames(prev => {
          const newMap = new Map(prev);
          newMap.set(remoteUserId, remoteUserName);
          return newMap;
        });
      }
      
      // Ensure video tracks are ready
      if (remoteStream) {
        remoteStream.getVideoTracks().forEach(track => {
          track.onunmute = () => {
            // Video track is ready, ensure it's enabled
            track.enabled = true;
          };
        });
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          userId: userIdRef.current
        });
      }
    };

    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      if (socketRef.current) {
        socketRef.current.emit('offer', {
          roomId,
          offer,
          userId: userIdRef.current
        });
      }
    }
  };

  const toggleVideo = () => {
    if (!localStream) {
      toast.error('Video stream not available. Please ensure your camera is connected.');
      return;
    }
    
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      
      // Provide user feedback
      if (videoTrack.enabled) {
        toast.success('Video enabled');
      } else {
        toast.info('Video disabled');
      }
      
        if (socketRef.current) {
          socketRef.current.emit('toggle-video', {
            roomId,
            userId: userIdRef.current,
            isVideoEnabled: videoTrack.enabled
          });
        }
    } else {
      toast.error('No video track found');
    }
  };

  const toggleAudio = () => {
    if (!localStream) {
      toast.error('Audio stream not available. Please ensure your microphone is connected.');
      return;
    }
    
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      
      // Provide user feedback
      if (audioTrack.enabled) {
        toast.success('Audio unmuted');
      } else {
        toast.info('Audio muted');
      }
      
        if (socketRef.current) {
          socketRef.current.emit('toggle-audio', {
            roomId,
            userId: userIdRef.current,
            isAudioEnabled: audioTrack.enabled
          });
        }
    } else {
      toast.error('No audio track found');
    }
  };

  // Push-to-Talk functionality
  const handlePushToTalkStart = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      setPushToTalkActive(true);
      setIsAudioEnabled(true);
    }
  };

  const handlePushToTalkStop = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
      setPushToTalkActive(false);
      setIsAudioEnabled(false);
    }
  };

  // Picture-in-Picture mode
  const togglePiP = async () => {
    if (!localVideoRef.current) return;
    
    try {
      if (!document.pictureInPictureElement) {
        await localVideoRef.current.requestPictureInPicture();
        setIsPiPMode(true);
      } else {
        await document.exitPictureInPicture();
        setIsPiPMode(false);
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast.error('Picture-in-Picture not supported or failed');
    }
  };

  // Participant pinning
  const togglePinParticipant = (userId) => {
    if (pinnedParticipant === userId) {
      setPinnedParticipant(null);
    } else {
      setPinnedParticipant(userId);
    }
  };

  // Get supported MIME type for recording
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'video/webm'; // Fallback
  };

  const startRecording = async () => {
    // Check subscription feature
    if (!requireFeature('record', 'Recording', subscription?.planId === 'free' ? 'Basic' : 'Basic')) {
      setShowUpgradePrompt(true);
      setUpgradePromptFeature('Recording');
      return;
    }

    if (!localStream) {
      toast.error('No local stream available. Please enable camera/microphone first.');
      return;
    }

    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      toast.error('MediaRecorder is not supported in your browser');
      return;
    }

    try {
      const stream = new MediaStream();
      localStream.getTracks().forEach(track => stream.addTrack(track));
      remoteStreams.forEach(remoteStream => {
        remoteStream.getTracks().forEach(track => stream.addTrack(track));
      });

      // Check if stream has any tracks
      if (stream.getTracks().length === 0) {
        toast.error('No media tracks available to record');
        return;
      }

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      const chunks = [];
      const startTime = Date.now();
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        toast.error('Recording error occurred');
        setIsRecording(false);
        setMediaRecorder(null);
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          toast.error('No recording data captured');
          return;
        }

        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);
        const durationStr = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
        
        const blob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const fileName = `recording-${roomId}-${startTime}.webm`;
        
        // Save recording to list
        const newRecording = {
          id: `recording-${startTime}`,
          name: `Meeting Recording - ${new Date(startTime).toLocaleString()}`,
          blob: blob,
          blobUrl: blobUrl,
          size: blob.size,
          duration: durationStr,
          timestamp: startTime,
          roomId: roomId,
          fileName: fileName
        };
        
        setRecordings(prev => [...prev, newRecording]);
        
        // Save to IndexedDB for persistence
        saveRecording(newRecording);
        
        // Auto-download option
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast.success(`Recording saved! Duration: ${durationStr}`);
      };

      // Start recording with timeslice for better compatibility
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      if (socketRef.current) {
        socketRef.current.emit('start-recording', { roomId });
      }
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotSupportedError') {
        toast.error('Recording is not supported in your browser');
      } else if (error.name === 'InvalidStateError') {
        toast.error('Recording is already in progress');
      } else {
        toast.error('Failed to start recording: ' + error.message);
      }
    }
  };

  const startStreamRecording = async () => {
    if (!localStream) {
      toast.error('No local stream available for recording');
      return;
    }

    try {
      const stream = new MediaStream();
      localStream.getTracks().forEach(track => stream.addTrack(track));
      remoteStreams.forEach(remoteStream => {
        remoteStream.getTracks().forEach(track => stream.addTrack(track));
      });

      if (stream.getTracks().length === 0) {
        toast.error('No media tracks available to record');
        return;
      }

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      const chunks = [];
      const startTime = Date.now();
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = (error) => {
        console.error('Stream recording error:', error);
        toast.error('Stream recording error occurred');
        setIsRecordingStream(false);
        setStreamRecordingRef(null);
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          toast.error('No stream recording data captured');
          return;
        }

        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);
        const durationStr = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
        
        const blob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const fileName = `stream-recording-${roomId}-${startTime}.webm`;
        
        const newRecording = {
          id: `stream-recording-${startTime}`,
          name: `Stream Recording - ${new Date(startTime).toLocaleString()}`,
          blob: blob,
          blobUrl: blobUrl,
          size: blob.size,
          duration: durationStr,
          timestamp: startTime,
          roomId: roomId,
          fileName: fileName
        };
        
        setRecordings(prev => [...prev, newRecording]);
        saveRecording(newRecording);
        
        toast.success(`Stream recording saved! Duration: ${durationStr}`);
      };

      recorder.start(1000);
      setStreamRecordingRef(recorder);
      setIsRecordingStream(true);
      toast.info('Recording stream started');
    } catch (error) {
      console.error('Error starting stream recording:', error);
      toast.error('Failed to start stream recording');
    }
  };

  const stopStreamRecording = () => {
    if (streamRecordingRef.current && streamRecordingRef.current.state !== 'inactive') {
      streamRecordingRef.current.stop();
      setStreamRecordingRef(null);
      setIsRecordingStream(false);
      toast.info('Stream recording stopped');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
      if (socketRef.current) {
        socketRef.current.emit('stop-recording', { roomId });
      }
      toast.info('Recording stopped. Check recordings panel.');
    }
  };

  const playRecording = (recording) => {
    // Recording is already played in the panel with video element
    // This can be used for additional actions if needed
  };

  const downloadRecording = (recording) => {
    const a = document.createElement('a');
    a.href = recording.blobUrl;
    a.download = recording.fileName;
    a.click();
    toast.success('Download started');
  };

  const deleteRecording = async (index) => {
    const recording = recordings[index];
    
    // Delete from IndexedDB
    await deleteRecordingFromDB(recording.id);
    
    // Clean up blob URL
    if (recording.blobUrl) {
      URL.revokeObjectURL(recording.blobUrl);
    }
    
    // Remove from state
    setRecordings(prev => prev.filter((_, i) => i !== index));
    toast.success('Recording deleted');
  };

  // Load recordings from IndexedDB on mount
  useEffect(() => {
    const loadSavedRecordings = async () => {
      try {
        const savedRecordings = await loadRecordings();
        // Filter by roomId if needed, or load all
        const roomRecordings = savedRecordings.filter(rec => rec.roomId === roomId);
        if (roomRecordings.length > 0) {
          setRecordings(roomRecordings);
        }
      } catch (error) {
        console.error('Error loading recordings:', error);
      }
    };
    
    loadSavedRecordings();
  }, [roomId]);

  const startScreenShare = async () => {
    console.log('Screen share button clicked');
    try {
      // Check if browser supports screen sharing
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error('Screen sharing is not supported in this browser');
        return;
      }

      console.log('Requesting screen share...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          cursor: 'always'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Check if user actually selected a source
      if (!stream || stream.getVideoTracks().length === 0) {
        toast.info('Screen sharing cancelled');
        return;
      }
      
      console.log('Screen share stream obtained:', stream);
      setScreenStream(stream);
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try {
          await localVideoRef.current.play();
        } catch (playError) {
          console.warn('Screen share video play will happen automatically:', playError);
        }
      }

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
      peersRef.current.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack).catch(err => {
              console.error('Error replacing track:', err);
            });
          }
        });
      }

      // Handle screen share end (user clicks stop in browser)
      videoTrack.onended = () => {
        stopScreenShare();
      };

      toast.success('Screen sharing started');
    } catch (error) {
      console.error('Error starting screen share:', error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Screen sharing permission denied. Please allow screen sharing in your browser.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No screen source found. Please check your display settings.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Screen sharing is already in use by another application.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        toast.error('Screen sharing constraints could not be satisfied.');
      } else {
        toast.error(`Failed to start screen sharing: ${error.message || 'Unknown error'}`);
      }
      
      setIsScreenSharing(false);
      setScreenStream(null);
      screenStreamRef.current = null;
    }
  };

  const stopScreenShare = async () => {
    try {
      // Stop screen stream tracks
      if (screenStream || screenStreamRef.current) {
        const streamToStop = screenStream || screenStreamRef.current;
        if (streamToStop) {
          streamToStop.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
      setScreenStream(null);
        screenStreamRef.current = null;
      }
      
      setIsScreenSharing(false);

      // Switch back to camera
      if (localStream) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          try {
            await localVideoRef.current.play();
          } catch (playError) {
            console.warn('Camera video play error:', playError);
          }
        }
        
        // Replace video track back to camera in all peer connections
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
        peersRef.current.forEach((peerConnection) => {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender && videoTrack) {
              sender.replaceTrack(videoTrack).catch(err => {
                console.error('Error replacing track back to camera:', err);
              });
          }
        });
        }
      }

      toast.info('Screen sharing stopped');
    } catch (error) {
      console.error('Error stopping screen share:', error);
      toast.error('Error stopping screen sharing');
      // Still reset state even if there's an error
      setIsScreenSharing(false);
      setScreenStream(null);
      screenStreamRef.current = null;
    }
  };

  const raiseHand = () => {
    if (socketRef.current) {
      if (!handRaised) {
        socketRef.current.emit('raise-hand', { roomId, userId: userIdRef.current, userName });
        setHandRaised(true);
        toast.info('Hand raised');
      } else {
        socketRef.current.emit('lower-hand', { roomId, userId: userIdRef.current });
        setHandRaised(false);
      }
    }
  };

  const startMeeting = () => {
    if (!isMainHost) {
      toast.error('Only the host can start the meeting');
      return;
    }
    
    if (socketRef.current && isMainHost) {
      socketRef.current.emit('start-meeting', {
        roomId,
        userId: userIdRef.current
      });
    } else {
      toast.error('Unable to start meeting. Please check your connection.');
    }
  };

  const joinMeeting = () => {
    if (socketRef.current) {
      // If in waiting room, request approval
      if (isInWaitingRoom) {
        socketRef.current.emit('request-join', {
          roomId,
          userId: userIdRef.current,
          userName
        });
        toast.info('Request sent to host');
      } else {
        // If meeting is waiting, try to initialize media and join
        initializeMedia();
        toast.info('Joining meeting...');
      }
    }
  };

  const endMeeting = async () => {
    if (!isMainHost) {
      toast.error('Only the host can end the meeting');
      return;
    }
    
      if (window.confirm('Are you sure you want to end the meeting for all participants?')) {
      try {
        // Save meeting to history
        const duration = meetingStartedAt 
          ? Math.round((Date.now() - new Date(meetingStartedAt).getTime()) / 60000)
          : 0;
        
        await axios.post(`${API_URL}/api/meetings/history`, {
          meetingId: roomId,
          title: `Meeting ${roomId}`,
          duration,
          participantsCount: participants.length,
          status: 'completed',
          roomId
        });
        
        if (socketRef.current) {
        socketRef.current.emit('end-meeting', {
          roomId,
          userId: userIdRef.current
        });
        }
      } catch (error) {
        console.error('Error saving meeting history:', error);
        // Still emit end-meeting even if history save fails
        if (socketRef.current) {
          socketRef.current.emit('end-meeting', {
            roomId,
            userId: userIdRef.current
          });
        }
      }
    }
  };

  const leaveRoom = async () => {
    // Track call minutes used before leaving
    if (meetingStartTimeRef.current && subscription && meetingStatus === 'started') {
      const endTime = new Date();
      const durationMinutes = Math.ceil((endTime - meetingStartTimeRef.current) / 60000);
      if (durationMinutes > 0 && subscription.callMinutes !== -1) {
        await trackMinutes(durationMinutes);
      }
      meetingStartTimeRef.current = null;
    }

    // Store room info for potential rejoin (if meeting is still active)
    if (meetingStatus === 'started' || meetingStatus === 'waiting') {
      const roomInfo = {
        roomId,
        password: roomPassword,
        userName,
        timestamp: Date.now()
      };
      localStorage.setItem('lastRoomInfo', JSON.stringify(roomInfo));
    }
    
    // Stop all screen sharing tracks
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setScreenStream(null);
      screenStreamRef.current = null; // Clear ref
      setIsScreenSharing(false);
    }
    
    // Stop all local media tracks (camera and microphone)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
      localStreamRef.current = null; // Clear ref
    }
    
    // Stop all remote streams
    remoteStreams.forEach((stream, userId) => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    });
    setRemoteStreams(new Map());
    
    // Close all peer connections
    peersRef.current.forEach((peerConnection, userId) => {
      if (peerConnection) {
        peerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        peerConnection.close();
      }
    });
    peersRef.current.clear();
    
    // Clear video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    remoteVideosRef.current.forEach((videoRef) => {
      if (videoRef && videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });
    remoteVideosRef.current.clear();
    
    // Stop media recorder if recording
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
    
    // Close socket connection
    if (socket) {
      socket.emit('leave-room', { roomId, userId: userIdRef.current });
      socket.close();
      socket.disconnect();
    }
    
    // Navigate to home
    navigate('/');
  };

  if (isInWaitingRoom) {
    return (
      <div className="waiting-room-screen">
        <div className="waiting-room-message">
          <h2>Waiting for Host Approval</h2>
          <p>Please wait while the host approves your request to join the meeting.</p>
        </div>
      </div>
    );
  }

  // Show Meeting Lobby before joining (unless skipped)
  if (showLobby && !skipLobby) {
    return (
      <MeetingLobby
        userName={userName}
        roomId={roomId}
        roomPassword={roomPassword}
        onJoin={(settings) => {
          setLobbyMediaSettings(settings);
          setShowLobby(false);
          // Initialize media with lobby settings
          initializeMedia();
        }}
        onCancel={() => {
          navigate('/');
        }}
      />
    );
  }

  if (meetingStatus === 'ended') {
    return (
      <div className="waiting-room-screen">
        <div className="waiting-room-message">
          <h2>Meeting Ended</h2>
          <p>The host has ended this meeting.</p>
          <button onClick={leaveRoom} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (meetingStatus === 'waiting' && !isMainHost) {
    return (
      <div className="waiting-room-screen">
        <div className="waiting-room-message">
          <h2>Waiting for Host to Start Meeting</h2>
          <p>Please wait while the host starts the meeting. You'll be connected once it begins.</p>
          <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={joinMeeting} className="btn btn-primary" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <HiPlay style={{ fontSize: '1.3rem' }} /> Join Meeting
            </button>
            <button onClick={leaveRoom} className="btn btn-secondary">
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      {showUpgradeBanner && subscription?.planId === 'free' && (
        <UpgradeBanner 
          featureName="Premium Features"
          planName="Pro"
          onDismiss={() => setShowUpgradeBanner(false)}
        />
      )}
      <div className="room-header">
        <div className="room-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2><HiVideoCamera className="header-icon" /> Room: {roomId}</h2>
            <ConnectionStatus 
              isConnected={socketConnected} 
              reconnectAttempts={socketReconnectAttempts}
            />
            {localStream && peersRef.current.size > 0 && (
              <ConnectionQuality peerConnection={Array.from(peersRef.current.values())[0]} />
            )}
            {hostName && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                <HiShieldCheck style={{ fontSize: '1rem' }} />
                <span>Host: {hostName}</span>
                {isMainHost && <span style={{ opacity: 0.8, marginLeft: '4px' }}>(You)</span>}
              </div>
            )}
          {meetingStartedAt && meetingStatus === 'started' && <MeetingTimer startedAt={meetingStartedAt} />}
          {meetingStatus === 'waiting' && isMainHost && (
            <span style={{ 
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
                fontWeight: '600'
            }}>
              Waiting to Start
            </span>
          )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {meetingStatus === 'started' && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isScreenSharing) {
                  stopScreenShare();
                } else {
                  startScreenShare();
                }
              }}
              className="btn-share-screen" 
              style={{
                background: isScreenSharing 
                  ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                  : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isScreenSharing 
                  ? '0 4px 12px rgba(244, 67, 54, 0.3)'
                  : '0 4px 12px rgba(33, 150, 243, 0.3)',
                transition: 'all 0.3s ease'
              }}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <HiComputerDesktop style={{ fontSize: '1.2rem' }} /> 
              {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            </button>
          )}
          <button 
            onClick={() => setShowShareMeeting(true)} 
            className="btn-share-meeting" 
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            title="Share Meeting"
          >
            <HiShare style={{ fontSize: '1.2rem' }} /> Share
          </button>
          {isMainHost && meetingStatus === 'waiting' && (
            <button onClick={startMeeting} className="btn-start-meeting" style={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <HiPlay style={{ fontSize: '1.2rem' }} /> Start Meeting
            </button>
          )}
          {!isMainHost && meetingStatus === 'waiting' && (
            <button onClick={joinMeeting} className="btn-join-meeting" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <HiPlay style={{ fontSize: '1.2rem' }} /> Join Meeting
            </button>
          )}
          {isMainHost && meetingStatus === 'started' && (
            <button onClick={endMeeting} className="btn-end-meeting" style={{
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <HiStop style={{ fontSize: '1.2rem' }} /> End Meeting
            </button>
          )}
          <button onClick={leaveRoom} className="btn-leave">
            Leave Room
          </button>
        </div>
      </div>

      {currentReaction && (
        <ReactionOverlay reaction={currentReaction.emoji} userName={currentReaction.userName} />
      )}

      {meetingStatus === 'started' && (
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '12px',
          padding: '12px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.9rem'
        }}>
          <HiShieldCheck style={{ color: '#667eea', fontSize: '1.2rem' }} />
          <span style={{ flex: 1 }}>
            <strong>Meeting Active</strong> - You can control your video and audio using the controls below. Leave and rejoin anytime.
          </span>
          {!isMainHost && !isModerator && (
            <span style={{
              background: 'rgba(102, 126, 234, 0.15)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}>
              Participant
            </span>
          )}
        </div>
      )}

      {meetingStatus === 'started' ? (
      <div className={`videos-container ${viewMode === 'speaker' ? 'speaker-view' : ''}`}>
          <div 
            className={`remote-videos ${viewMode === 'grid' ? 'grid-layout' : 'speaker-layout'} ${maximizedVideo ? 'has-maximized' : ''}`}
            style={{
              gridTemplateColumns: viewMode === 'grid' && !maximizedVideo
                ? remoteStreams.size === 1 
                  ? '1fr' 
                  : remoteStreams.size === 2 
                    ? 'repeat(2, minmax(calc(55% - 10px), 1fr))' 
                    : remoteStreams.size === 3
                      ? 'repeat(2, minmax(calc(55% - 10px), 1fr))'
                      : `repeat(auto-fit, minmax(calc(55% - 10px), 1fr))`
                : undefined,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {Array.from(remoteStreams.entries())
              .sort(([aId], [bId]) => {
                // Sort pinned participant first
                if (pinnedParticipant === aId) return -1;
                if (pinnedParticipant === bId) return 1;
                return 0;
              })
              .map(([userId, stream]) => {
              const isMinimized = minimizedVideos.has(userId);
              const isMaximized = maximizedVideo === userId;
              
              if (maximizedVideo && !isMaximized) {
                return null; // Hide other videos when one is maximized
              }
              
              // Show pinned participant first
              const isPinned = pinnedParticipant === userId;
              
              return (
            <RemoteVideo
              key={userId}
              stream={stream}
              userName={remoteUserNames.get(userId) || `User ${userId.substring(0, 8)}`}
              userId={userId}
                  isMaximized={isMaximized}
                  isMinimized={isMinimized}
                  isPinned={isPinned}
                  onPin={togglePinParticipant}
                  onMaximize={(id) => {
                    setMaximizedVideo(id || null);
                    if (id) {
                      setMinimizedVideos(new Set());
                    }
                  }}
                  onMinimize={(id) => {
                    if (id === null) {
                      setMaximizedVideo(null);
                      setMinimizedVideos(new Set());
                    } else {
                      setMaximizedVideo(null);
                      setMinimizedVideos(prev => new Set([...prev, id]));
                    }
                  }}
                />
              );
            })}
        </div>
        
          <div className={`local-video-wrapper ${minimizedVideos.size > 0 && !maximizedVideo ? 'minimized' : ''}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
              style={{ 
                opacity: localStream && isVideoEnabled ? 1 : 0.3, 
                display: 'block',
                visibility: 'visible',
                width: '100%',
                height: '100%'
              }}
            />
            {(!localStream || !isVideoEnabled) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                textAlign: 'center',
                zIndex: 10
              }}>
                {!localStream ? 'Camera not available' : 'Video disabled'}
              </div>
            )}
          <VoiceActivityIndicator stream={localStream} userId={userIdRef.current} isLocal={true} />
          <div className="video-label">
            {userName} (You)
            {handRaised && <span className="hand-raised-indicator"><HiHandRaised /></span>}
          </div>
            <div className="video-controls">
              <button 
                className="video-control-btn" 
                onClick={async () => {
                  const element = localVideoRef.current?.parentElement;
                  if (!element) return;
                  try {
                    if (!document.fullscreenElement) {
                      if (element.requestFullscreen) {
                        await element.requestFullscreen();
                      } else if (element.webkitRequestFullscreen) {
                        await element.webkitRequestFullscreen();
                      } else if (element.mozRequestFullScreen) {
                        await element.mozRequestFullScreen();
                      } else if (element.msRequestFullscreen) {
                        await element.msRequestFullscreen();
                      }
                    } else {
                      if (document.exitFullscreen) {
                        await document.exitFullscreen();
                      } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                      } else if (document.mozCancelFullScreen) {
                        await document.mozCancelFullScreen();
                      } else if (document.msExitFullscreen) {
                        await document.msExitFullscreen();
                      }
                    }
                  } catch (error) {
                    console.error('Fullscreen error:', error);
                    toast.error('Fullscreen not supported or denied');
                  }
                }}
                title="Fullscreen"
              >
                <HiArrowsPointingOut />
              </button>
        </div>
      </div>
          <CaptionsOverlay 
            currentCaption={currentCaptionText}
            displayedCaptions={displayedCaptions}
            enabled={captionsEnabled || showCaptions}
            translations={captionTranslations}
            translationSettings={translationSettings}
          />
        </div>
      ) : meetingStatus === 'waiting' && isMainHost ? (
        <div className="waiting-to-start-screen">
          <div className="waiting-room-message">
            <HiVideoCamera style={{ fontSize: '4rem', marginBottom: '20px', color: '#667eea' }} />
            <h2>Ready to Start Meeting</h2>
            <p>Participants are waiting. Click "Start Meeting" in the header to begin.</p>
            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Participants waiting: {participants.length}
              </p>
              <button onClick={startMeeting} className="btn btn-primary" style={{ 
                padding: '14px 32px',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <HiPlay style={{ fontSize: '1.3rem' }} /> Start Meeting Now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {meetingStatus === 'started' && (
      <div className="controls">
        <button
          onClick={toggleVideo}
          className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
          title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
        >
          {isVideoEnabled ? <HiVideoCamera /> : <HiVideoCameraSlash />}
          <span className="control-btn-label">{isVideoEnabled ? 'Video' : 'Video Off'}</span>
        </button>
        <button
          onClick={toggleAudio}
          className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <HiMicrophone /> : <HiSpeakerXMark />}
          <span className="control-btn-label">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isScreenSharing) {
              stopScreenShare();
            } else {
              startScreenShare();
            }
          }}
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <><HiComputerDesktop /><HiCheckCircle className="check-icon" /></> : <HiComputerDesktop />}
          <span className="control-btn-label">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
        </button>
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={`control-btn ${showParticipants ? 'active' : ''}`}
          title="Participants"
        >
          <HiUserGroup />
          <span className="control-btn-label">People</span>
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`control-btn ${showChat ? 'active' : ''}`}
          title="Chat (C)"
        >
          <HiChatBubbleLeftRight />
          <span className="control-btn-label">Chat</span>
        </button>
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`control-btn ${showReactions ? 'active' : ''}`}
          title="Reactions"
        >
          <HiFaceSmile />
          <span className="control-btn-label">Reactions</span>
        </button>
        <button
          onClick={raiseHand}
          className={`control-btn ${handRaised ? 'active' : ''}`}
          title="Raise Hand"
        >
          <HiHandRaised />
          <span className="control-btn-label">Raise Hand</span>
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
          className="control-btn"
          title={`Switch to ${viewMode === 'grid' ? 'Speaker' : 'Grid'} View`}
        >
          {viewMode === 'grid' ? <HiSquare3Stack3D /> : <HiViewColumns />}
          <span className="control-btn-label">{viewMode === 'grid' ? 'Grid' : 'Speaker'}</span>
        </button>
        <button
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          className={`control-btn ${showWhiteboard ? 'active' : ''}`}
          title="Whiteboard"
        >
          <HiPencilSquare />
          <span className="control-btn-label">Whiteboard</span>
        </button>
        {(isMainHost || isModerator) && canPerform('liveStreaming') && (
          <button
            onClick={() => {
              if (!requireFeature('liveStreaming', 'Live Streaming', 'Pro')) {
                setShowUpgradePrompt(true);
                setUpgradePromptFeature('Live Streaming');
                return;
              }
              setShowStreaming(!showStreaming);
            }}
            className={`control-btn ${isStreaming ? 'streaming-active' : ''}`}
            title={isStreaming ? 'Stop Streaming' : 'Live Streaming'}
          >
            <HiVideoCamera />
            {isStreaming && <HiCheckCircle className="streaming-indicator" />}
            <span className="control-btn-label">{isStreaming ? 'Stop Stream' : 'Stream'}</span>
          </button>
        )}

        <button
          onClick={() => setShowCaptions(!showCaptions)}
          className={`control-btn ${showCaptions ? 'active' : ''}`}
          title="Live Captions"
        >
          <HiLanguage />
          <span className="control-btn-label">Captions</span>
        </button>
        <button
          onClick={() => setShowTranscription(!showTranscription)}
          className={`control-btn ${showTranscription ? 'active' : ''}`}
          title="Meeting Transcription"
        >
          <HiLanguage />
          <span className="control-btn-label">Transcript</span>
        </button>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`control-btn ${showTranslation ? 'active' : ''}`}
          title="Meeting Translation"
        >
          <HiGlobeAlt />
          <span className="control-btn-label">Translate</span>
        </button>
        <button
          onClick={() => setShowNoiseSuppression(!showNoiseSuppression)}
          className={`control-btn ${showNoiseSuppression ? 'active' : ''}`}
          title="Background Noise Suppression"
        >
          <HiMicrophone />
          <span className="control-btn-label">Noise Filter</span>
        </button>
        {isScreenSharing && (
          <button
            onClick={() => setShowScreenAnnotation(!showScreenAnnotation)}
            className={`control-btn ${showScreenAnnotation ? 'active' : ''}`}
            title="Annotate Screen"
          >
            <HiPencilSquare />
            <span className="control-btn-label">Annotate</span>
          </button>
        )}
        <button
          onClick={() => setShowFileShare(!showFileShare)}
          className={`control-btn ${showFileShare ? 'active' : ''}`}
          title="Share Files"
        >
          <HiPaperClip />
          <span className="control-btn-label">Files</span>
        </button>
        {document.pictureInPictureEnabled && (
          <button
            onClick={togglePiP}
            className={`control-btn ${isPiPMode ? 'active' : ''}`}
            title="Picture-in-Picture"
          >
            <HiMiniPresentationChartBar />
            <span className="control-btn-label">PiP</span>
          </button>
        )}
        <button
          onMouseDown={handlePushToTalkStart}
          onMouseUp={handlePushToTalkStop}
          onTouchStart={handlePushToTalkStart}
          onTouchEnd={handlePushToTalkStop}
          className={`control-btn ${pushToTalkActive ? 'active' : ''}`}
          title="Push to Talk (Hold)"
        >
          <HiMicrophone />
          <span className="control-btn-label">PTT</span>
        </button>
        <button
          onClick={() => setShowPolls(!showPolls)}
          className={`control-btn ${showPolls ? 'active' : ''}`}
          title="Polls"
        >
          <HiChartBar />
          <span className="control-btn-label">Polls</span>
        </button>
        {(isMainHost || isModerator) && canPerform('breakoutRooms') && (
          <button
            onClick={() => {
              if (!requireFeature('breakoutRooms', 'Breakout Rooms', 'Pro')) {
                setShowUpgradePrompt(true);
                setUpgradePromptFeature('Breakout Rooms');
                return;
              }
              setShowBreakoutRooms(!showBreakoutRooms);
            }}
            className={`control-btn ${showBreakoutRooms ? 'active' : ''}`}
            title="Breakout Rooms"
          >
            <HiUserGroup />
            <span className="control-btn-label">Breakouts</span>
          </button>
        )}
        {(isMainHost || isModerator) && (
          <button
            onClick={() => setShowWaitingRoom(!showWaitingRoom)}
            className={`control-btn ${showWaitingRoom ? 'active' : ''}`}
            title="Waiting Room"
          >
            <HiBuildingOffice2 />
            <span className="control-btn-label">Waiting</span>
          </button>
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`control-btn ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <HiStopCircle /> : <HiVideoCamera />}
          <span className="control-btn-label">{isRecording ? 'Stop Record' : 'Record'}</span>
        </button>
        <button
          onClick={() => setShowRecordings(!showRecordings)}
          className={`control-btn ${showRecordings ? 'active' : ''}`}
          title={`View Recordings (${recordings.length})`}
        >
          <HiVideoCamera />
          <span className="control-btn-label">Recordings</span>
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`control-btn ${showSettings ? 'active' : ''}`}
          title="Settings"
        >
          <HiCog6Tooth />
          <span className="control-btn-label">Settings</span>
        </button>
        <button
          onClick={() => setShowMeetingHistory(!showMeetingHistory)}
          className="control-btn"
          title="Meeting History"
        >
          <HiChartBar />
          <span className="control-btn-label">History</span>
        </button>
        <button
          onClick={leaveRoom}
          className="control-btn leave-btn"
          title="Leave meeting"
        >
          <HiPhoneArrowUpRight />
          <span className="control-btn-label">Leave</span>
        </button>
      </div>
      )}

      <ReactionsPanel
        socket={socket}
        roomId={roomId}
        userId={userIdRef.current}
        userName={userName}
        isOpen={showReactions}
        onClose={() => setShowReactions(false)}
        onReaction={() => setShowReactions(false)}
      />

      {(isMainHost || isModerator) && (
        <WaitingRoomPanel
          socket={socket}
          roomId={roomId}
          userId={userIdRef.current}
          isHost={isHost}
          isMainHost={isMainHost}
          isModerator={isModerator}
          isOpen={showWaitingRoom}
          onClose={() => setShowWaitingRoom(false)}
          waitingUsers={waitingUsers}
        />
      )}

      <Whiteboard
        socket={socket}
        roomId={roomId}
        userId={userIdRef.current}
        isOpen={showWhiteboard}
        onClose={() => setShowWhiteboard(false)}
      />

      <PollsPanel
        socket={socket}
        roomId={roomId}
        userId={userIdRef.current}
        isHost={isHost}
        isOpen={showPolls}
        onClose={() => setShowPolls(false)}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onVideoQualityChange={handleVideoQualityChange}
        currentQuality={videoQuality}
      />

      <ChatPanel
        socket={socket}
        roomId={roomId}
        userId={userIdRef.current}
        userName={userName}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      <ParticipantsPanel
        socket={socket}
        roomId={roomId}
        userId={userIdRef.current}
        isHost={isHost}
        isMainHost={isMainHost}
        isModerator={isModerator}
        mainHost={mainHost}
        moderators={moderators}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={participants}
      />

      <RecordingsPanel
        isOpen={showRecordings}
        onClose={() => setShowRecordings(false)}
        recordings={recordings}
        onPlay={playRecording}
        onDownload={downloadRecording}
        onDelete={deleteRecording}
      />

      <ShareMeeting
        isOpen={showShareMeeting}
        onClose={() => setShowShareMeeting(false)}
        roomId={roomId}
        roomPassword={roomPassword}
      />

      <StreamingPanel
        isOpen={showStreaming}
        onClose={() => setShowStreaming(false)}
        roomId={roomId}
        userId={userIdRef.current}
        isHost={isMainHost}
        onEnableCaptions={() => setShowCaptions(true)}
        audioStream={localStream}
      />

      <CaptionsPanel
        isOpen={showCaptions}
        onClose={() => setShowCaptions(false)}
        audioStream={localStream}
        isStreaming={isStreaming}
        socket={socketRef.current}
        roomId={roomId}
        userId={userIdRef.current}
        userName={userName}
        onCaptionsEnabledChange={setCaptionsEnabled}
        translationSettings={translationSettings}
      />

      <ScreenAnnotation
        isOpen={showScreenAnnotation}
        onClose={() => setShowScreenAnnotation(false)}
        screenStream={screenStream}
      />

      <FileSharePanel
        isOpen={showFileShare}
        onClose={() => setShowFileShare(false)}
        socket={socketRef.current}
        roomId={roomId}
        userId={userIdRef.current}
      />

      <MeetingHistory
        isOpen={showMeetingHistory}
        onClose={() => setShowMeetingHistory(false)}
      />

      <NoiseSuppressionPanel
        isOpen={showNoiseSuppression}
        onClose={() => setShowNoiseSuppression(false)}
        audioStream={localStream}
      />

      <TranscriptionPanel
        isOpen={showTranscription}
        onClose={() => setShowTranscription(false)}
        socket={socketRef.current}
        roomId={roomId}
        userId={userIdRef.current}
        userName={userName}
        audioStream={localStream}
        translationSettings={translationSettings}
      />

      <TranslationPanel
        isOpen={showTranslation}
        onClose={() => setShowTranslation(false)}
        socket={socketRef.current}
        roomId={roomId}
        userId={userIdRef.current}
        userName={userName}
        onTranslationSettingsChange={(settings) => {
          setTranslationSettings(settings);
        }}
      />

      <BreakoutRooms
        isOpen={showBreakoutRooms}
        onClose={() => setShowBreakoutRooms(false)}
        socket={socketRef.current}
        roomId={roomId}
        userId={userIdRef.current}
        isHost={isHost}
        participants={participants}
      />

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        featureName={upgradePromptFeature}
        planName={upgradePromptFeature === 'Recording' ? 'Basic' : 'Pro'}
        highlightFeatures={
          upgradePromptFeature === 'Recording' 
            ? ['Local Recording', 'Unlimited meetings', '10 hours/month']
            : ['Live Streaming', 'Breakout Rooms', 'Calendar Integration', 'Cloud Recording', 'Advanced Analytics']
        }
      />
    </div>
  );
}

export default Room;

