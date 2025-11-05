import React, { useState, useEffect, useRef } from 'react';
import { HiXMark, HiLanguage, HiArrowDownTray, HiPlay, HiStop, HiArrowsPointingIn, HiChevronDown } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';
import './TranscriptionPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function TranscriptionPanel({ isOpen, onClose, socket, roomId, userId, userName, audioStream }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [transcriptions, setTranscriptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !audioStream) return;

    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        transcriptRef.current += final;
        setTranscript(transcriptRef.current);
        setInterimTranscript('');

        // Broadcast transcript to other participants
        if (socket && roomId && userId && userName) {
          socket.emit('transcription', {
            roomId,
            userId,
            userName,
            text: final.trim(),
            timestamp: Date.now()
          });
        }
      } else if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // This is normal, ignore
        return;
      }
      toast.error(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart recognition if still recording
        try {
          recognition.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
        }
      }
    };

    recognitionRef.current = recognition;

    if (isRecording) {
      recognition.start();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, audioStream, isRecording, socket, roomId, userId, userName]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.info('Transcription stopped');
    } else {
      transcriptRef.current = transcript;
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success('Transcription started');
    }
  };

  const saveTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('No transcript to save');
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post(`${API_URL}/api/transcriptions`, {
        roomId,
        userId,
        userName,
        transcript,
        timestamp: new Date().toISOString()
      });

      setTranscriptions(prev => [...prev, response.data]);
      toast.success('Transcript saved successfully');
      setTranscript('');
      transcriptRef.current = '';
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast.error('Failed to save transcript');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadTranscript = async (format = 'txt') => {
    if (!transcript.trim()) {
      toast.error('No transcript to download');
      return;
    }

    const fileName = `transcript-${roomId}-${Date.now()}`;
    const meetingTitle = `Meeting Transcription - ${new Date().toLocaleString()}`;

    try {
      if (format === 'txt') {
        const blob = new Blob([transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Transcript downloaded as TXT');
      } else if (format === 'docx') {
        await downloadAsWord(transcript, fileName, meetingTitle);
      } else if (format === 'pdf') {
        await downloadAsPDF(transcript, fileName, meetingTitle);
      }
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error('Failed to download transcript');
    }
  };

  const downloadAsWord = async (text, fileName, title) => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Room ID: ${roomId}`,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${new Date().toLocaleString()}`,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: '', break: 1 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Transcript:',
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    size: 24,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Transcript downloaded as Word document');
    } catch (error) {
      console.error('Error creating Word document:', error);
      toast.error('Failed to create Word document');
      throw error;
    }
  };

  const downloadAsPDF = async (text, fileName, title) => {
    try {
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 14, 20);
      
      // Room ID and Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Room ID: ${roomId}`, 14, 30);
      pdf.text(`Date: ${new Date().toLocaleString()}`, 14, 35);
      
      // Add spacing
      let yPosition = 45;
      
      // Transcript title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transcript:', 14, yPosition);
      yPosition += 10;
      
      // Add transcript text with word wrapping
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const maxWidth = 190; // Page width minus margins
      const lineHeight = 7;
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 14, yPosition);
        yPosition += lineHeight;
      });
      
      pdf.save(`${fileName}.pdf`);
      toast.success('Transcript downloaded as PDF');
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast.error('Failed to create PDF');
      throw error;
    }
  };

  const downloadSavedTranscript = async (item, format = 'txt') => {
    const fileName = `transcript-${item.id || Date.now()}`;
    const title = `Meeting Transcription - ${new Date(item.timestamp).toLocaleString()}`;

    try {
      if (format === 'txt') {
        const blob = new Blob([item.transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Transcript downloaded as TXT');
      } else if (format === 'docx') {
        await downloadAsWord(item.transcript, fileName, title);
      } else if (format === 'pdf') {
        await downloadAsPDF(item.transcript, fileName, title);
      }
    } catch (error) {
      console.error('Error downloading saved transcript:', error);
      toast.error('Failed to download transcript');
    }
  };

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  const clearTranscript = () => {
    setTranscript('');
    transcriptRef.current = '';
    setInterimTranscript('');
    toast.info('Transcript cleared');
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsMinimized(false);
    onClose();
  };

  // Reset minimized state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Show minimized bar when minimized
  if (isMinimized) {
    return (
      <div className="transcription-panel-minimized">
        <div className="minimized-bar">
          <div className="minimized-info">
            <HiLanguage />
            <span>Transcription {isRecording && <span className="recording-indicator">●</span>}</span>
          </div>
          <div className="minimized-actions">
            <button onClick={handleRestore} className="restore-btn" title="Restore">
              <HiArrowsPointingIn />
            </button>
            <button onClick={handleClose} className="close-btn" title="Close">
              <HiXMark />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transcription-panel-overlay" onClick={onClose}>
      <div className="transcription-panel" onClick={(e) => e.stopPropagation()}>
        <div className="transcription-header">
          <h2>Meeting Transcription</h2>
          <div className="header-actions">
            <button onClick={handleMinimize} className="minimize-btn" title="Minimize">
              <HiArrowsPointingIn />
            </button>
            <button onClick={handleClose} className="close-btn" title="Close">
              <HiXMark />
            </button>
          </div>
        </div>

        <div className="transcription-content">
          <div className="transcription-controls">
            <button
              onClick={toggleRecording}
              className={`record-btn ${isRecording ? 'recording' : ''}`}
            >
              {isRecording ? <HiStop /> : <HiPlay />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button
              onClick={saveTranscript}
              disabled={!transcript.trim() || isSaving}
              className="save-btn"
            >
              <HiArrowDownTray />
              {isSaving ? 'Saving...' : 'Save Transcript'}
            </button>
            <div className="download-menu-wrapper" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={!transcript.trim()}
                className="download-btn"
              >
                <HiArrowDownTray />
                Download
                <HiChevronDown style={{ fontSize: '14px', marginLeft: '4px' }} />
              </button>
              {showDownloadMenu && (
                <div className="download-menu">
                  <button
                    onClick={() => downloadTranscript('txt')}
                    className="download-menu-item"
                  >
                    <HiArrowDownTray />
                    Download as TXT
                  </button>
                  <button
                    onClick={() => downloadTranscript('docx')}
                    className="download-menu-item"
                  >
                    <HiArrowDownTray />
                    Download as Word (.docx)
                  </button>
                  <button
                    onClick={() => downloadTranscript('pdf')}
                    className="download-menu-item"
                  >
                    <HiArrowDownTray />
                    Download as PDF
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={clearTranscript}
              disabled={!transcript.trim()}
              className="clear-btn"
            >
              Clear
            </button>
          </div>

          <div className="transcript-display">
            <div className="transcript-text">
              {transcript}
              {interimTranscript && (
                <span className="interim-text">{interimTranscript}</span>
              )}
            </div>
            {!transcript && !interimTranscript && (
              <div className="empty-transcript">
                Transcript will appear here when recording starts...
              </div>
            )}
          </div>

          {transcriptions.length > 0 && (
            <div className="saved-transcriptions">
              <h3>Saved Transcripts ({transcriptions.length})</h3>
              <div className="transcription-list">
                {transcriptions.map((item, index) => (
                  <div key={index} className="transcription-item">
                    <div className="transcription-meta">
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                      <span>{item.userName}</span>
                    </div>
                    <div className="download-item-menu-wrapper">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const menuId = `download-menu-${index}`;
                          const existingMenu = document.getElementById(menuId);
                          if (existingMenu) {
                            existingMenu.remove();
                          } else {
                            // Remove any existing menus
                            document.querySelectorAll('.download-item-menu').forEach(m => m.remove());
                            
                            const menu = document.createElement('div');
                            menu.id = menuId;
                            menu.className = 'download-item-menu';
                            menu.innerHTML = `
                              <button class="download-menu-item" data-format="txt">TXT</button>
                              <button class="download-menu-item" data-format="docx">Word</button>
                              <button class="download-menu-item" data-format="pdf">PDF</button>
                            `;
                            
                            const rect = e.currentTarget.getBoundingClientRect();
                            menu.style.position = 'fixed';
                            menu.style.top = `${rect.bottom + 5}px`;
                            menu.style.right = `${window.innerWidth - rect.right}px`;
                            menu.style.zIndex = '10000';
                            
                            menu.addEventListener('click', (ev) => {
                              const format = ev.target.getAttribute('data-format');
                              if (format) {
                                downloadSavedTranscript(item, format);
                                menu.remove();
                              }
                            });
                            
                            document.body.appendChild(menu);
                            
                            // Close menu on outside click
                            setTimeout(() => {
                              const closeMenu = (event) => {
                                if (!menu.contains(event.target) && event.target !== e.currentTarget) {
                                  menu.remove();
                                  document.removeEventListener('click', closeMenu);
                                }
                              };
                              document.addEventListener('click', closeMenu);
                            }, 0);
                          }
                        }}
                        className="download-item-btn"
                      >
                        <HiArrowDownTray />
                        <HiChevronDown style={{ fontSize: '12px', marginLeft: '2px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TranscriptionPanel;

