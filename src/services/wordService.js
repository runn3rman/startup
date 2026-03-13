import { apiGet } from './apiClient';

export async function getNextWord() {
  return apiGet('/api/words/next', 'Failed to load word');
}

export async function getDefinition(word) {
  return {
    word,
    definition: `${word} (mock): sample dictionary definition for practice mode.`,
    source: 'mock-dictionary-api',
    fetchedAt: new Date().toISOString(),
  };
}

export async function getPracticeWords(level = 'easy') {
  return apiGet(`/api/words/practice?level=${encodeURIComponent(level)}`, 'Failed to load practice words');
}
