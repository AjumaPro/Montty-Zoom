import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing media stream (camera/microphone)
 */
export const useMediaStream = (constraints = { video: true, audio: true }) => {
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const startStream = async (newConstraints = null) => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const finalConstraints = newConstraints || constraints;
      
      // Fallback for older browsers
      let mediaStream;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        mediaStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      } else if (navigator.getUserMedia) {
        // Fallback for older browsers (deprecated but still used)
        mediaStream = await new Promise((resolve, reject) => {
          navigator.getUserMedia(finalConstraints, resolve, reject);
        });
      } else if (navigator.webkitGetUserMedia) {
        // Webkit fallback
        mediaStream = await new Promise((resolve, reject) => {
          navigator.webkitGetUserMedia(finalConstraints, resolve, reject);
        });
      } else if (navigator.mozGetUserMedia) {
        // Firefox fallback
        mediaStream = await new Promise((resolve, reject) => {
          navigator.mozGetUserMedia(finalConstraints, resolve, reject);
        });
      } else {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsLoading(false);
      
      return mediaStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError(err);
      setIsLoading(false);
      
      let errorMessage = 'Failed to access camera/microphone';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone permission denied. Please allow access and refresh.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please connect a device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is being used by another application.';
      }
      
      toast.error(errorMessage);
      throw err;
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  };

  const getVideoEnabled = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      return videoTrack ? videoTrack.enabled : false;
    }
    return false;
  };

  const getAudioEnabled = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      return audioTrack ? audioTrack.enabled : false;
    }
    return false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    stream,
    isLoading,
    error,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    getVideoEnabled,
    getAudioEnabled
  };
};

