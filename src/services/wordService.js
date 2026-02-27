const WORDS = ['planet', 'orbit', 'echo', 'velocity', 'glide', 'nova', 'flux'];

export async function getNextWord() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return {
    word,
    source: 'mock-random-word-api',
    fetchedAt: new Date().toISOString(),
  };
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
  const byLevel = {
    easy: ['cat', 'dog', 'sun'],
    medium: ['planet', 'window', 'garden'],
    hard: ['velocity', 'synchronize', 'trajectory'],
  };

  return {
    level,
    words: byLevel[level] || byLevel.easy,
    fetchedAt: new Date().toISOString(),
  };
}
