export async function scoreAttempt({ expectedWord, strokeCount = 0, durationMs = 8500 }) {
  const normalizedDuration = Math.max(durationMs, 1000);
  const speedScore = Math.max(0, Math.round(1000 - normalizedDuration / 12));

  const baseAccuracy = expectedWord.length > 6 ? 90 : 94;
  const strokeBonus = Math.min(6, Math.floor(strokeCount / 8));
  const accuracy = Math.min(99, baseAccuracy + strokeBonus);

  const predictedWord = Math.random() < 0.85 ? expectedWord : `${expectedWord.slice(0, -1)}x`;
  const totalScore = Math.round(speedScore * (accuracy / 100));

  return {
    expectedWord,
    predictedWord,
    accuracy,
    speedScore,
    totalScore,
    durationMs: normalizedDuration,
    judgedAt: new Date().toISOString(),
    model: {
      name: 'ink-mock-ocr-v1',
      confidence: Number((accuracy / 100).toFixed(2)),
    },
  };
}
