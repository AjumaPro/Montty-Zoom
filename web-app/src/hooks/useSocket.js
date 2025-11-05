import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Custom hook for managing Socket.io connection with auto-reconnect
 */
export const useSocket = (roomId, userId, userName, password, onConnect, onError) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!roomId || !userId) return;

    // Create socket connection
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;

    // Connection handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      toast.success('Connected to server');
      
      if (onConnect) {
        onConnect();
      }

      // Join room on connect
      newSocket.emit('join-room', {
        roomId,
        userId,
        userName,
        password
      });
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      } else {
        toast.warning('Disconnected from server. Reconnecting...');
      }
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
      setReconnectAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= maxReconnectAttempts) {
          toast.error('Failed to connect to server. Please refresh the page.');
          if (onError) onError(error);
        } else {
          toast.info(`Reconnecting... (${newAttempts}/${maxReconnectAttempts})`);
        }
        return newAttempts;
      });
    });

    newSocket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      setReconnectAttempts(0);
      toast.success('Reconnected to server');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      toast.info(`Reconnection attempt ${attemptNumber}...`);
    });

    newSocket.on('reconnect_failed', () => {
      toast.error('Failed to reconnect. Please refresh the page.');
      if (onError) onError(new Error('Reconnection failed'));
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, [roomId, userId, userName, password, onConnect, onError]);

  return { socket, isConnected, reconnectAttempts };
};

