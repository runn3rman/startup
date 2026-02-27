const PLAYERS = ['Seth', 'Mia', 'Avery', 'Jay', 'Sky'];
const WORDS = ['planet', 'orbit', 'echo', 'nova', 'flux'];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generateEvent() {
  const type = Math.random() < 0.35 ? 'newRecord' : 'attemptFinished';
  const player = randomItem(PLAYERS);
  const word = randomItem(WORDS);
  const timeSeconds = Number((4 + Math.random() * 4).toFixed(1));
  const isCorrect = Math.random() < 0.8;

  return {
    id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type,
    player,
    word,
    timeSeconds,
    isCorrect,
    createdAt: new Date().toISOString(),
  };
}

export function subscribeToLiveEvents(onEvent, intervalMs = 3000) {
  const timer = setInterval(() => {
    onEvent(generateEvent());
  }, intervalMs);

  return () => clearInterval(timer);
}
