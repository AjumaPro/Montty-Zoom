import React, { useState, useEffect, useRef } from 'react';
import { HiLanguage, HiMicrophone, HiStop, HiXMark } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import { translationService, SUPPORTED_LANGUAGES } from '../utils/translationService';
import './CaptionsPanel.css';

function CaptionsPanel({ isOpen, onClose, audioStream, isStreaming, socket, roomId, userId, userName, onCaptionsEnabledChange, translationSettings }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [translationLanguages, setTranslationLanguages] = useState(['es']);
  const [translatedCaptions, setTranslatedCaptions] = useState({}); // { lang: translatedText }
  const [isTranslating, setIsTranslating] = useState(false);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const lastCaptionTimeRef = useRef(Date.now());

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ru-RU', name: 'Russian' }
  ];

  // Update translation settings when prop changes
  useEffect(() => {
    if (translationSettings) {
      setTranslationEnabled(translationSettings.enabled || false);
      if (translationSettings.targetLanguages && translationSettings.targetLanguages.length > 0) {
        setTranslationLanguages(translationSettings.targetLanguages);
      }
    }
  }, [translationSettings]);

  useEffect(() => {
    if (isEnabled && audioStream) {
      startCaptions();
    } else {
      stopCaptions();
    }
    return () => {
      stopCaptions();
    };
  }, [isEnabled, audioStream, selectedLanguage]);

  const startCaptions = () => {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in your browser');
      setIsEnabled(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const timestamp = Date.now();
          const captionText = finalTranscript.trim();
          setCaptions(prev => [...prev.slice(-10), { text: captionText, timestamp }]);
          setCurrentCaption(captionText);
          
          // Broadcast caption to other participants
          if (socket && roomId && userId && userName) {
            socket.emit('caption', {
              roomId,
              userId,
              userName,
              text: captionText,
              timestamp
            });
          }
          
          // Translate if enabled
          if (translationEnabled && translationLanguages.length > 0) {
            translateText(captionText, timestamp);
          }
          
          lastCaptionTimeRef.current = timestamp;
        } else if (interimTranscript) {
          setCurrentCaption(interimTranscript);
          
          // Broadcast interim results too (optional)
          if (socket && roomId && userId && userName && interimTranscript.length > 10) {
            socket.emit('caption-interim', {
              roomId,
              userId,
              userName,
              text: interimTranscript
            });
          }
        }
      };

      recognition.onerror = (event) => {
        // Ignore harmless errors
        const harmlessErrors = ['aborted', 'no-speech', 'audio-capture'];
        if (harmlessErrors.includes(event.error)) {
          // These are normal and don't need user notification
          return;
        }
        
        console.error('Speech recognition error:', event.error);
        // Only show actual errors to user
        if (event.error !== 'network' && event.error !== 'not-allowed') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Restart recognition if still enabled
        if (isEnabled) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }, 100);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error('Failed to start speech recognition');
      setIsEnabled(false);
    }
  };

  const stopCaptions = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setCurrentCaption('');
    setTranslatedCaptions({});
  };

  const translateText = async (text, timestamp) => {
    if (!text.trim() || !translationEnabled || translationLanguages.length === 0) return;

    setIsTranslating(true);
    const translations = {};

    try {
      // Translate to all selected languages
      const translatePromises = translationLanguages.map(async (targetLang) => {
        try {
          const result = await translationService.translate(
            text,
            targetLang,
            selectedLanguage.split('-')[0] || 'auto'
          );
          return { lang: targetLang, text: result.translatedText };
        } catch (error) {
          console.error(`Translation to ${targetLang} failed:`, error);
          return { lang: targetLang, text: null };
        }
      });

      const results = await Promise.all(translatePromises);
      
      results.forEach(({ lang, text: translatedText }) => {
        if (translatedText) {
          translations[lang] = translatedText;
        }
      });

      // Update translated captions
      setTranslatedCaptions(translations);

      // Broadcast translations to other participants
      if (socket && roomId && userId && userName && Object.keys(translations).length > 0) {
        socket.emit('translation', {
          roomId,
          userId,
          userName,
          originalText: text,
          translations,
          timestamp: timestamp || Date.now()
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Silently fail - translation is optional
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    // Notify parent component
    if (onCaptionsEnabledChange) {
      onCaptionsEnabledChange(newState);
    }
    
    // Broadcast caption state change
    if (socket && roomId && userId && userName) {
      if (newState) {
        socket.emit('caption-started', {
          roomId,
          userId,
          userName
        });
      } else {
        socket.emit('caption-stopped', {
          roomId,
          userId,
          userName
        });
      }
    }
  };

  const clearCaptions = () => {
    setCaptions([]);
    setCurrentCaption('');
    setTranslatedCaptions({});
  };

  if (!isOpen) return null;

  return (
    <div className="captions-panel-overlay" onClick={onClose}>
      <div className="captions-panel" onClick={(e) => e.stopPropagation()}>
        <div className="captions-panel-header">
          <h2>Live Captions & Translations</h2>
          <button className="captions-panel-close" onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        <div className="captions-panel-content">
          {!isStreaming && (
            <div className="captions-warning">
              <p>⚠️ Captions work best when streaming is active</p>
            </div>
          )}

          <div className="captions-controls">
            <button
              className={`captions-toggle-btn ${isEnabled ? 'active' : ''}`}
              onClick={handleToggle}
              disabled={!audioStream}
            >
              <HiMicrophone />
              {isEnabled ? 'Stop Captions' : 'Start Captions'}
            </button>

            {isEnabled && (
              <div className="captions-settings">
                <div className="setting-group">
                  <label>Speech Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      stopCaptions();
                      setTimeout(() => startCaptions(), 100);
                    }}
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={translationEnabled}
                      onChange={(e) => setTranslationEnabled(e.target.checked)}
                    />
                    Enable Translation
                  </label>
                  {translationEnabled && translationLanguages.length > 0 && (
                    <div className="translation-languages-info">
                      <small>Translating to: {translationLanguages.map(langCode => {
                        const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                        return langObj ? langObj.name : langCode;
                      }).join(', ')}</small>
                    </div>
                  )}
                </div>

                <button className="btn-clear-captions" onClick={clearCaptions}>
                  Clear Captions
                </button>
              </div>
            )}
          </div>

          {isEnabled && (
            <div className="captions-display">
              <div className="current-caption">
                <h3>Current Caption:</h3>
                <p className="caption-text">{currentCaption || 'Listening...'}</p>
                {translationEnabled && Object.keys(translatedCaptions).length > 0 && (
                  <div className="translations-display">
                    {Object.entries(translatedCaptions).map(([langCode, translatedText]) => {
                      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                      return (
                        <p key={langCode} className="caption-text translated">
                          <strong>{langObj ? `${langObj.flag} ${langObj.name}` : langCode}:</strong> {translatedText}
                        </p>
                      );
                    })}
                    {isTranslating && <span className="translating-indicator">Translating...</span>}
                  </div>
                )}
              </div>

              {captions.length > 0 && (
                <div className="captions-history">
                  <h3>Caption History:</h3>
                  <div className="captions-list">
                    {captions.slice(-5).reverse().map((caption, index) => (
                      <div key={index} className="caption-item">
                        <span className="caption-time">
                          {new Date(caption.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="caption-content">{caption.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!audioStream && (
            <div className="captions-info">
              <p>⚠️ No audio stream detected. Please enable your microphone.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaptionsPanel;

