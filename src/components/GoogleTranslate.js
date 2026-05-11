import { useEffect } from 'react';
import { changeLanguage, getStoredLanguage, loadGoogleTranslate } from '../utils/googleTranslate';

const GoogleTranslate = () => {
  useEffect(() => {
    let isMounted = true;

    const initTranslate = async () => {
      try {
        await loadGoogleTranslate();

        if (!isMounted) {
          return;
        }

        const language = getStoredLanguage();
        await changeLanguage(language);
      } catch (error) {
        // Keep app usable if translation service is unavailable.
        // eslint-disable-next-line no-console
        console.warn('Backend translation is unavailable:', error.message);
      }
    };

    initTranslate();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
};

export default GoogleTranslate;