const STORAGE_KEY = 'preferredLanguage';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOURCE_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Dutch' },
  { code: 'tr', label: 'Turkish' },
];

const isBrowser = typeof window !== 'undefined';

const originalTextNodeMap = new WeakMap();
const originalPlaceholderMap = new WeakMap();

let currentLanguage = 'en';
let translationObserver = null;
let observerTimer = null;

const normalizeLanguage = (languageCode) => {
  return SUPPORTED_LANGUAGES.some((language) => language.code === languageCode)
    ? languageCode
    : 'en';
};

const shouldSkipElement = (element) => {
  if (!element) {
    return true;
  }

  if (element.closest('.language-switcher')) {
    return true;
  }

  const tagName = element.tagName?.toLowerCase();
  return ['script', 'style', 'noscript', 'iframe', 'svg'].includes(tagName);
};

const collectTextNodes = () => {
  if (!isBrowser || !document.body) {
    return [];
  }

  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  let current = walker.nextNode();
  while (current) {
    const parent = current.parentElement;
    if (!shouldSkipElement(parent)) {
      const value = current.nodeValue || '';
      const trimmed = value.trim();
      if (trimmed && /[A-Za-z]/.test(trimmed)) {
        nodes.push(current);
      }
    }

    current = walker.nextNode();
  }

  return nodes;
};

const collectPlaceholderInputs = () => {
  if (!isBrowser || !document.body) {
    return [];
  }

  return Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'))
    .filter((element) => !shouldSkipElement(element) && /[A-Za-z]/.test((element.placeholder || '').trim()));
};

const resetOriginalLanguage = () => {
  collectTextNodes().forEach((node) => {
    const original = originalTextNodeMap.get(node);
    if (typeof original === 'string') {
      node.nodeValue = original;
    }
  });

  collectPlaceholderInputs().forEach((element) => {
    const original = originalPlaceholderMap.get(element);
    if (typeof original === 'string') {
      element.placeholder = original;
    }
  });
};

const translateTextsViaBackend = async (texts, targetLang) => {
  const response = await fetch(`${API_URL}/public/translate-ui`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts,
      sourceLang: SOURCE_LANGUAGE,
      targetLang,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translate API failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.translations)) {
    throw new Error('Invalid translate API response');
  }

  return payload.translations;
};

const applyBackendTranslation = async (targetLang) => {
  if (!isBrowser || !document.body) {
    return;
  }

  const textNodes = collectTextNodes();
  const placeholderInputs = collectPlaceholderInputs();

  const sourceTexts = [];

  const textNodeSources = textNodes.map((node) => {
    const source = originalTextNodeMap.get(node) ?? node.nodeValue;
    originalTextNodeMap.set(node, source);
    sourceTexts.push(source);
    return source;
  });

  const placeholderSources = placeholderInputs.map((element) => {
    const source = originalPlaceholderMap.get(element) ?? element.placeholder;
    originalPlaceholderMap.set(element, source);
    sourceTexts.push(source);
    return source;
  });

  if (!sourceTexts.length) {
    return;
  }

  const uniqueTexts = Array.from(new Set(sourceTexts));
  const translations = await translateTextsViaBackend(uniqueTexts, targetLang);
  const translationMap = new Map(uniqueTexts.map((text, index) => [text, translations[index] || text]));

  textNodes.forEach((node, index) => {
    node.nodeValue = translationMap.get(textNodeSources[index]) || textNodeSources[index];
  });

  placeholderInputs.forEach((element, index) => {
    element.placeholder = translationMap.get(placeholderSources[index]) || placeholderSources[index];
  });
};

const ensureTranslationObserver = () => {
  if (!isBrowser || translationObserver || !document.body) {
    return;
  }

  translationObserver = new MutationObserver(() => {
    if (currentLanguage === 'en') {
      return;
    }

    if (observerTimer) {
      window.clearTimeout(observerTimer);
    }

    observerTimer = window.setTimeout(() => {
      applyBackendTranslation(currentLanguage).catch(() => {});
    }, 120);
  });

  translationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

export const loadGoogleTranslate = () => {
  ensureTranslationObserver();
  return Promise.resolve(true);
};

export const getStoredLanguage = () => {
  if (!isBrowser) {
    return 'en';
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return normalizeLanguage(stored);
};

export const storeLanguage = (languageCode) => {
  if (!isBrowser) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, normalizeLanguage(languageCode));
};

export const changeLanguage = async (languageCode) => {
  if (!isBrowser) {
    return false;
  }

  const safeLanguage = normalizeLanguage(languageCode);
  currentLanguage = safeLanguage;

  storeLanguage(safeLanguage);

  if (safeLanguage === 'en') {
    resetOriginalLanguage();
    return true;
  }

  try {
    await applyBackendTranslation(safeLanguage);
    return true;
  } catch (error) {
    return false;
  }
};
