import React from 'react';
import { SUPPORTED_LANGUAGES } from '../utils/translationService';
import './CaptionsOverlay.css';

function CaptionsOverlay({ currentCaption, displayedCaptions, enabled, translations = {}, translationSettings }) {
  if (!enabled || (!currentCaption && displayedCaptions.length === 0)) {
    return null;
  }

  const showTranslations = translationSettings && translationSettings.enabled && translationSettings.targetLanguages;

  return (
    <div className="captions-overlay">
      {currentCaption && (
        <div className="caption-current">
          <div className="caption-text">{currentCaption}</div>
        </div>
      )}
      {displayedCaptions.length > 0 && (
        <div className="captions-history-overlay">
          {displayedCaptions.slice(-3).reverse().map((caption, index) => {
            const captionTranslations = translations[caption.id] || {};
            return (
              <div key={caption.id || index} className="caption-item-overlay">
                <div className="caption-main">
                  <span className="caption-user">{caption.userName}:</span>
                  <span className="caption-content">{caption.text}</span>
                </div>
                {showTranslations && Object.keys(captionTranslations).length > 0 && (
                  <div className="caption-translations">
                    {Object.entries(captionTranslations).map(([langCode, translatedText]) => {
                      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                      return (
                        <div key={langCode} className="caption-translation">
                          <span className="translation-lang">{langObj ? `${langObj.flag} ${langObj.name}` : langCode}:</span>
                          <span className="translation-text">{translatedText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CaptionsOverlay;

