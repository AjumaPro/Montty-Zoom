import React, { useState, useEffect, useCallback } from 'react';
import { HiLanguage, HiXMark, HiCheckCircle, HiGlobeAlt, HiArrowsPointingIn } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import { translationService, SUPPORTED_LANGUAGES } from '../utils/translationService';
import './TranslationPanel.css';

function TranslationPanel({ isOpen, onClose, socket, roomId, userId, userName, onTranslationSettingsChange }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(['es']); // Default to Spanish
  const [autoDetectSource, setAutoDetectSource] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [translationHistory, setTranslationHistory] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState(null); // Current translation being displayed

  // Translate text function
  const translateText = useCallback(async (text, sourceLang = null) => {
    if (!text || !text.trim() || selectedLanguages.length === 0) {
      return {};
    }

    setIsTranslating(true);
    const translations = {};

    try {
      // Translate to all selected languages
      const translatePromises = selectedLanguages.map(async (targetLang) => {
        try {
          const result = await translationService.translate(
            text,
            targetLang,
            sourceLang || (autoDetectSource ? 'auto' : sourceLanguage)
          );
          return { lang: targetLang, text: result.translatedText };
        } catch (error) {
          console.error(`Translation to ${targetLang} failed:`, error);
          return { lang: targetLang, text: null, error: error.message };
        }
      });

      const results = await Promise.all(translatePromises);
      
      results.forEach(({ lang, text: translatedText }) => {
        if (translatedText) {
          translations[lang] = translatedText;
        }
      });

      // Broadcast translation to other participants
      if (socket && roomId && userId && userName) {
        socket.emit('translation', {
          roomId,
          userId,
          userName,
          originalText: text,
          translations,
          timestamp: Date.now()
        });
      }

      return translations;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
      return {};
    } finally {
      setIsTranslating(false);
    }
  }, [selectedLanguages, autoDetectSource, sourceLanguage, socket, roomId, userId, userName]);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for translation events from other participants
    if (socket) {
      const handleTranslation = (data) => {
        const { userId: senderId, userName: senderName, originalText, translations, timestamp } = data;
        
        setTranslationHistory(prev => [
          ...prev.slice(-49), // Keep last 50 translations
          {
            id: Date.now(),
            senderId,
            senderName,
            originalText,
            translations,
            timestamp
          }
        ]);
      };

      // Listen for captions and auto-translate them
      const handleCaption = async (data) => {
        console.log('Caption received:', data);
        console.log('Translation enabled:', isEnabled);
        console.log('Selected languages:', selectedLanguages);
        if (isEnabled && data.text && data.userName && selectedLanguages.length > 0) {
          console.log('Caption received, translating:', data.text);
          setIsTranslating(true);
          // Auto-translate incoming captions
          const translations = await translateText(data.text);
          console.log('Translation result:', translations);
          if (Object.keys(translations).length > 0) {
            const newItem = {
              id: Date.now(),
              senderId: data.userId,
              senderName: data.userName,
              originalText: data.text,
              translations,
              timestamp: data.timestamp || Date.now()
            };
            console.log('Adding to history:', newItem);
            setTranslationHistory(prev => {
              const updated = [...prev.slice(-49), newItem];
              console.log('Updated history length:', updated.length);
              return updated;
            });
            // Also set as current translation for live display
            setCurrentTranslation(newItem);
            // Clear current translation after 5 seconds
            setTimeout(() => {
              setCurrentTranslation(null);
            }, 5000);
          } else {
            console.warn('No translations returned for:', data.text);
          }
          setIsTranslating(false);
        } else {
          console.log('Skipping translation - enabled:', isEnabled, 'has text:', !!data.text, 'has userName:', !!data.userName, 'languages:', selectedLanguages.length);
        }
      };

      socket.on('translation', handleTranslation);
      socket.on('caption', handleCaption);
      socket.on('translation-enabled', (data) => {
        if (data.userId !== userId) {
          toast.info(`${data.userName} enabled translations`);
        }
      });
      socket.on('translation-disabled', (data) => {
        if (data.userId !== userId) {
          toast.info(`${data.userName} disabled translations`);
        }
      });

      return () => {
        socket.off('translation', handleTranslation);
        socket.off('caption', handleCaption);
        socket.off('translation-enabled');
        socket.off('translation-disabled');
      };
    }
  }, [isOpen, socket, userId, isEnabled, selectedLanguages, translateText]);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // Notify parent component
    if (onTranslationSettingsChange) {
      onTranslationSettingsChange({
        enabled: newState,
        targetLanguages: selectedLanguages,
        sourceLanguage: autoDetectSource ? 'auto' : sourceLanguage
      });
    }

    // Broadcast translation state change
    if (socket && roomId && userId && userName) {
      if (newState) {
        socket.emit('translation-enabled', {
          roomId,
          userId,
          userName,
          targetLanguages: selectedLanguages
        });
      } else {
        socket.emit('translation-disabled', {
          roomId,
          userId,
          userName
        });
      }
    }

    toast.success(`Translation ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleLanguageToggle = (langCode) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langCode)) {
        // Remove language
        const newLangs = prev.filter(l => l !== langCode);
        if (newLangs.length === 0) {
          toast.warning('At least one target language must be selected');
          return prev;
        }
        return newLangs;
      } else {
        // Add language (max 5 languages)
        if (prev.length >= 5) {
          toast.warning('Maximum 5 languages can be selected');
          return prev;
        }
        return [...prev, langCode];
      }
    });
  };

  const handleTestTranslation = async () => {
    const testText = "Hello, this is a test translation";
    console.log('Testing translation with text:', testText);
    console.log('Selected languages:', selectedLanguages);
    const translations = await translateText(testText);
    console.log('Test translation result:', translations);
    if (Object.keys(translations).length > 0) {
      setTranslationHistory(prev => [
        ...prev.slice(-49),
        {
          id: Date.now(),
          senderId: userId,
          senderName: userName || 'You',
          originalText: testText,
          translations,
          timestamp: Date.now()
        }
      ]);
      toast.success(`Test translation completed! Translated to ${Object.keys(translations).length} language(s)`);
      const testItem = {
        id: Date.now(),
        senderId: userId,
        senderName: userName || 'You',
        originalText: testText,
        translations,
        timestamp: Date.now()
      };
      setCurrentTranslation(testItem);
      setTimeout(() => {
        setCurrentTranslation(null);
      }, 5000);
    } else {
      toast.error('Translation failed. Check console for errors.');
      console.error('Translation returned empty object');
    }
  };

  const clearHistory = () => {
    setTranslationHistory([]);
    toast.info('Translation history cleared');
  };

  const getLanguageName = (code) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
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
      <div className="translation-panel-minimized">
        <div className="minimized-bar">
          <div className="minimized-info">
            <HiGlobeAlt />
            <span>Translation {isEnabled && <span className="status-indicator">●</span>}</span>
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
    <div className="translation-panel-overlay" onClick={onClose}>
      <div className="translation-panel" onClick={(e) => e.stopPropagation()}>
        <div className="translation-panel-header">
          <div className="header-title">
            <HiLanguage />
            <h2>Meeting Translation</h2>
          </div>
          <div className="header-actions">
            <button onClick={handleMinimize} className="minimize-btn" title="Minimize">
              <HiArrowsPointingIn />
            </button>
            <button className="translation-panel-close" onClick={handleClose}>
              <HiXMark />
            </button>
          </div>
        </div>

        <div className="translation-panel-content">
          <div className="translation-controls">
            <div className="control-section">
              <button
                className={`translation-toggle-btn ${isEnabled ? 'active' : ''}`}
                onClick={handleToggle}
              >
                <HiGlobeAlt />
                {isEnabled ? 'Translation Enabled' : 'Enable Translation'}
              </button>
              {isEnabled && (
                <div className="translation-status">
                  <HiCheckCircle className="status-icon" />
                  <span>Translating to {selectedLanguages.length} language(s)</span>
                </div>
              )}
            </div>

            {isEnabled && (
              <div className="settings-section">
                <div className="setting-group">
                  <button 
                    onClick={handleTestTranslation}
                    className="test-translation-btn"
                    disabled={isTranslating || selectedLanguages.length === 0}
                  >
                    Test Translation
                  </button>
                </div>
                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoDetectSource}
                      onChange={(e) => setAutoDetectSource(e.target.checked)}
                    />
                    Auto-detect source language
                  </label>
                </div>

                {!autoDetectSource && (
                  <div className="setting-group">
                    <label>Source Language</label>
                    <select
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                    >
                      <option value="auto">Auto-detect</option>
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="setting-group">
                  <label>Target Languages (Select up to 5)</label>
                  <div className="language-selector">
                    <button
                      className="language-selector-btn"
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                    >
                      Select Languages ({selectedLanguages.length} selected)
                    </button>
                    {showLanguageSelector && (
                      <div className="language-grid">
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            className={`language-option ${selectedLanguages.includes(lang.code) ? 'selected' : ''}`}
                            onClick={() => handleLanguageToggle(lang.code)}
                          >
                            {lang.flag} {lang.name}
                            {selectedLanguages.includes(lang.code) && (
                              <HiCheckCircle className="check-icon" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedLanguages.length > 0 && (
                    <div className="selected-languages">
                      {selectedLanguages.map(langCode => (
                        <span key={langCode} className="language-tag">
                          {getLanguageName(langCode)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isEnabled && currentTranslation && (
            <div className="current-translation-display">
              <h3>📍 Current Translation (Live):</h3>
              <div className="current-translation-item">
                <div className="translation-original">
                  <strong>Original:</strong> {currentTranslation.originalText}
                </div>
                {currentTranslation.translations && Object.keys(currentTranslation.translations).length > 0 ? (
                  <div className="translation-translations">
                    {Object.entries(currentTranslation.translations).map(([lang, text]) => (
                      <div key={lang} className="translation-text">
                        <strong>{getLanguageName(lang)}:</strong> {text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="translation-text error">Translating...</div>
                )}
              </div>
            </div>
          )}

          {isEnabled && (
            <div className="translation-history-section">
              <div className="history-header">
                <h3>📜 Translation History ({translationHistory.length})</h3>
                {translationHistory.length > 0 && (
                  <button className="clear-history-btn" onClick={clearHistory}>
                    Clear
                  </button>
                )}
              </div>
              {translationHistory.length > 0 ? (
                <div className="translation-history">
                  {translationHistory.slice(-10).reverse().map((item) => (
                    <div key={item.id} className="translation-item">
                      <div className="translation-meta">
                        <span className="sender-name">{item.senderName}</span>
                        <span className="translation-time">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="translation-original">
                        <strong>Original:</strong> {item.originalText}
                      </div>
                      {item.translations && Object.keys(item.translations).length > 0 ? (
                        <div className="translation-translations">
                          {Object.entries(item.translations).map(([lang, text]) => (
                            <div key={lang} className="translation-text">
                              <strong>{getLanguageName(lang)}:</strong> {text}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="translation-text error">
                          No translations available
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="translation-info">
                  <p>No translations yet. Translations will appear here as participants speak.</p>
                  <p className="info-note">
                    Make sure captions are enabled and participants are speaking.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isEnabled && (
            <div className="translation-info">
              <p>Enable translation to see translated text as participants speak.</p>
            </div>
          )}

          {isEnabled && (
            <div className="translation-locations-info">
              <h4>📍 Where Translations Appear:</h4>
              <ul className="locations-list">
                <li>✅ <strong>This Panel</strong> - Current translation & history (shown above)</li>
                <li>✅ <strong>Video Overlay</strong> - Translations appear below captions on video</li>
                <li>✅ <strong>Captions Panel</strong> - Translations shown with captions</li>
                <li>✅ <strong>Transcription Panel</strong> - Translated transcripts</li>
              </ul>
            </div>
          )}

          {isTranslating && (
            <div className="translation-loading">
              <div className="loading-spinner"></div>
              <span>Translating...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export function to translate text (for use in other components)
export const translateMeetingText = async (text, targetLanguages, sourceLanguage = 'auto') => {
  const translations = {};
  
  for (const targetLang of targetLanguages) {
    try {
      const result = await translationService.translate(text, targetLang, sourceLanguage);
      translations[targetLang] = result.translatedText;
    } catch (error) {
      console.error(`Translation to ${targetLang} failed:`, error);
    }
  }
  
  return translations;
};

export default TranslationPanel;

