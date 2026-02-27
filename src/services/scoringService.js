export async function scoreAttempt({ expectedWord, strokeCount = 0, durationMs = 8500 }) {
  const normalizedDuration = Math.max(durationMs, 1000);
  const bonus = Math.min(0.1, Math.floor(strokeCount / 15) * 0.01);
  const correctChance = 0.75 + bonus;
  const predictedWord = Math.random() < correctChance ? expectedWord : `${expectedWord.slice(0, -1)}x`;
  const isCorrect = predictedWord.toLowerCase() === expectedWord.toLowerCase();

  return {
    expectedWord,
    predictedWord,
    isCorrect,
    durationMs: normalizedDuration,
    timeSeconds: Number((normalizedDuration / 1000).toFixed(1)),
    judgedAt: new Date().toISOString(),
  };
}
