import React, { useState, useEffect, useRef } from 'react';
import { HiSignal, HiWifi } from 'react-icons/hi2';
import './ConnectionQuality.css';

function ConnectionQuality({ peerConnection }) {
  const [quality, setQuality] = useState('good');
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!peerConnection) return;

    const checkConnection = async () => {
      try {
        const stats = await peerConnection.getStats();
        let totalBytesReceived = 0;
        let totalBytesSent = 0;
        let totalPacketsLost = 0;
        let totalPackets = 0;
        let rtt = null;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            totalBytesReceived += report.bytesReceived || 0;
            totalPacketsLost += report.packetsLost || 0;
            totalPackets += (report.packetsReceived || 0) + (report.packetsLost || 0);
            if (report.jitter) rtt = report.jitter;
          }
          if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
            totalBytesSent += report.bytesSent || 0;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime) {
              rtt = report.currentRoundTripTime * 1000; // Convert to ms
            }
          }
        });

        const packetLossRate = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;
        
        let newQuality = 'good';
        if (packetLossRate > 10 || (rtt && rtt > 500)) {
          newQuality = 'poor';
        } else if (packetLossRate > 5 || (rtt && rtt > 300)) {
          newQuality = 'fair';
        }

        setQuality(newQuality);
        setStats({
          packetLoss: packetLossRate.toFixed(1),
          rtt: rtt ? rtt.toFixed(0) : 'N/A',
          bytesReceived: totalBytesReceived,
          bytesSent: totalBytesSent
        });
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    };

    intervalRef.current = setInterval(checkConnection, 3000);
    checkConnection();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [peerConnection]);

  if (!peerConnection) return null;

  return (
    <div className={`connection-quality ${quality}`} title={`Connection: ${quality}`}>
      <HiWifi className="quality-icon" />
      <span className="quality-text">{quality}</span>
    </div>
  );
}

export default ConnectionQuality;

