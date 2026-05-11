import { useMemo, useState, useEffect } from 'react';
import { changeLanguage, getStoredLanguage, SUPPORTED_LANGUAGES, loadGoogleTranslate } from '../utils/googleTranslate';

const LanguageSwitcher = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    const init = async () => {
      const storedLanguage = getStoredLanguage();
      setSelectedLanguage(storedLanguage);
      await loadGoogleTranslate();
      await changeLanguage(storedLanguage);
    };

    init();
  }, []);

  const options = useMemo(() => {
    return SUPPORTED_LANGUAGES.map((language) => (
      <option key={language.code} value={language.code}>
        {language.label}
      </option>
    ));
  }, []);

  const handleLanguageChange = async (event) => {
    const languageCode = event.target.value;

    setSelectedLanguage(languageCode);
    await changeLanguage(languageCode);
  };

  return (
    <div className="language-switcher" aria-label="Language selector">
      <select
        id="language-switcher"
        className="language-switcher-select"
        value={selectedLanguage}
        onChange={handleLanguageChange}
      >
        {options}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
