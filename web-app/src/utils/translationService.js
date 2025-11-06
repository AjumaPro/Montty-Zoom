/**
 * Translation Service
 * Supports multiple translation APIs with fallback options
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Supported languages with their codes
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' }
];

// Speech recognition language codes (for Web Speech API)
export const SPEECH_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', translationCode: 'en' },
  { code: 'en-GB', name: 'English (UK)', translationCode: 'en' },
  { code: 'es-ES', name: 'Spanish', translationCode: 'es' },
  { code: 'es-MX', name: 'Spanish (Mexico)', translationCode: 'es' },
  { code: 'fr-FR', name: 'French', translationCode: 'fr' },
  { code: 'de-DE', name: 'German', translationCode: 'de' },
  { code: 'it-IT', name: 'Italian', translationCode: 'it' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', translationCode: 'pt' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', translationCode: 'pt' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', translationCode: 'zh' },
  { code: 'ja-JP', name: 'Japanese', translationCode: 'ja' },
  { code: 'ko-KR', name: 'Korean', translationCode: 'ko' },
  { code: 'ar-SA', name: 'Arabic', translationCode: 'ar' },
  { code: 'hi-IN', name: 'Hindi', translationCode: 'hi' },
  { code: 'ru-RU', name: 'Russian', translationCode: 'ru' },
  { code: 'nl-NL', name: 'Dutch', translationCode: 'nl' },
  { code: 'pl-PL', name: 'Polish', translationCode: 'pl' },
  { code: 'tr-TR', name: 'Turkish', translationCode: 'tr' },
  { code: 'sv-SE', name: 'Swedish', translationCode: 'sv' },
  { code: 'vi-VN', name: 'Vietnamese', translationCode: 'vi' },
  { code: 'th-TH', name: 'Thai', translationCode: 'th' },
  { code: 'id-ID', name: 'Indonesian', translationCode: 'id' },
  { code: 'he-IL', name: 'Hebrew', translationCode: 'he' }
];

class TranslationService {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache
    this.apiProvider = this.detectProvider();
  }

  /**
   * Detect which translation API provider to use
   */
  detectProvider() {
    // Priority order: Google Translate API > Azure Translator > MyMemory (free)
    if (process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY) {
      return 'google';
    }
    if (process.env.REACT_APP_AZURE_TRANSLATOR_KEY && process.env.REACT_APP_AZURE_TRANSLATOR_REGION) {
      return 'azure';
    }
    return 'mymemory'; // Free fallback
  }

  /**
   * Generate cache key
   */
  getCacheKey(text, targetLang, sourceLang = 'auto') {
    return `${sourceLang}:${targetLang}:${text}`;
  }

  /**
   * Translate text using Google Translate API
   */
  async translateWithGoogle(text, targetLang, sourceLang = 'auto') {
    const apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: targetLang,
            source: sourceLang === 'auto' ? undefined : sourceLang,
            format: 'text'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        translatedText: data.data.translations[0].translatedText,
        detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage || sourceLang
      };
    } catch (error) {
      console.error('Google Translate error:', error);
      throw error;
    }
  }

  /**
   * Translate text using Azure Translator API
   */
  async translateWithAzure(text, targetLang, sourceLang = 'auto') {
    const apiKey = process.env.REACT_APP_AZURE_TRANSLATOR_KEY;
    const region = process.env.REACT_APP_AZURE_TRANSLATOR_REGION;
    
    if (!apiKey || !region) {
      throw new Error('Azure Translator credentials not configured');
    }

    try {
      const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}${sourceLang !== 'auto' ? `&from=${sourceLang}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ text }])
      });

      if (!response.ok) {
        throw new Error(`Azure Translator API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        translatedText: data[0].translations[0].text,
        detectedSourceLanguage: data[0].detectedLanguage?.language || sourceLang
      };
    } catch (error) {
      console.error('Azure Translator error:', error);
      throw error;
    }
  }

  /**
   * Translate text using MyMemory API (free, fallback)
   */
  async translateWithMyMemory(text, targetLang, sourceLang = 'auto') {
    try {
      // MyMemory uses language pairs like 'en|es'
      const langPair = sourceLang === 'auto' 
        ? `en|${targetLang}` // Default to English if auto-detect
        : `${sourceLang}|${targetLang}`;

      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
      );

      if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        return {
          translatedText: data.responseData.translatedText,
          detectedSourceLanguage: sourceLang
        };
      } else {
        throw new Error('MyMemory translation failed');
      }
    } catch (error) {
      console.error('MyMemory translation error:', error);
      throw error;
    }
  }

  /**
   * Translate text using backend API (recommended for production)
   */
  async translateWithBackend(text, targetLang, sourceLang = 'auto') {
    try {
      const response = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang
        })
      });

      if (!response.ok) {
        throw new Error(`Backend translation API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        translatedText: data.translatedText,
        detectedSourceLanguage: data.detectedSourceLanguage || sourceLang
      };
    } catch (error) {
      console.error('Backend translation error:', error);
      throw error;
    }
  }

  /**
   * Main translate method with fallback chain
   */
  async translate(text, targetLang, sourceLang = 'auto') {
    if (!text || !text.trim()) {
      return { translatedText: '', detectedSourceLanguage: sourceLang };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Try translation providers in order
    const providers = [
      () => this.translateWithBackend(text, targetLang, sourceLang),
      () => this.translateWithGoogle(text, targetLang, sourceLang),
      () => this.translateWithAzure(text, targetLang, sourceLang),
      () => this.translateWithMyMemory(text, targetLang, sourceLang)
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        
        // Cache the result
        this.cache.set(cacheKey, result);
        
        // Limit cache size (keep last 100 translations)
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        
        return result;
      } catch (error) {
        console.warn('Translation provider failed, trying next:', error.message);
        continue;
      }
    }

    // All providers failed
    throw new Error('All translation providers failed');
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(texts, targetLang, sourceLang = 'auto') {
    const results = await Promise.all(
      texts.map(text => this.translate(text, targetLang, sourceLang))
    );
    return results;
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text) {
    try {
      // Try backend first
      const response = await fetch(`${API_URL}/api/translate/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const data = await response.json();
        return data.language;
      }
    } catch (error) {
      console.warn('Backend language detection failed, using fallback');
    }

    // Fallback: use first two characters as language hint
    // This is a simple heuristic
    return 'en'; // Default to English
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const translationService = new TranslationService();

// Export class for testing
export default TranslationService;

