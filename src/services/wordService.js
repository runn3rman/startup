import { apiGet } from './apiClient';

const MERRIAM_WEBSTER_KEY = import.meta.env.VITE_MERRIAM_WEBSTER_KEY;

export async function getNextWord() {
  return apiGet('/api/words/next', 'Failed to load word');
}

export async function getDefinition(word) {
  const normalizedWord = String(word || '').trim();
  if (!normalizedWord) {
    return { word: '', definition: '', source: 'merriam-webster', fetchedAt: new Date().toISOString() };
  }

  if (!MERRIAM_WEBSTER_KEY) {
    throw new Error('Missing VITE_MERRIAM_WEBSTER_KEY');
  }

  const response = await fetch(
    `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(normalizedWord)}?key=${encodeURIComponent(MERRIAM_WEBSTER_KEY)}`
  );

  if (!response.ok) {
    throw new Error('Failed to load definition');
  }

  const data = await response.json();
  const firstEntry = Array.isArray(data) ? data.find((item) => item && typeof item === 'object' && Array.isArray(item.shortdef)) : null;
  const definition = firstEntry?.shortdef?.[0] || 'No definition found.';

  return {
    word: normalizedWord,
    definition,
    source: 'merriam-webster',
    fetchedAt: new Date().toISOString(),
  };
}

export async function getPracticeWords(level = 'easy') {
  return apiGet(`/api/words/practice?level=${encodeURIComponent(level)}`, 'Failed to load practice words');
}
