import { apiPost } from './apiClient';

export async function predictHandwriting({ targetWord, strokePayload = [], imageDataUrl = '', durationMs = 0 }) {
  const strokeCount = strokePayload.length;
  const pointCount = strokePayload.reduce((sum, stroke) => sum + stroke.points.length, 0);
  const normalizedDuration = Math.max(durationMs, 100);

  if (!imageDataUrl) {
    throw new Error('No canvas image found');
  }

  const body = await apiPost('/api/predict', { imageDataUrl, targetWord }, 'Prediction request failed');
  const predictedWord = (body.predictedWord || '').trim();
  if (!predictedWord) {
    throw new Error('Prediction response was empty');
  }

  const isCorrect = predictedWord.toLowerCase() === targetWord.toLowerCase();

  return {
    targetWord,
    predictedWord,
    isCorrect,
    strokeCount,
    pointCount,
    imageDataUrl,
    durationMs: normalizedDuration,
    timeSeconds: Number((normalizedDuration / 1000).toFixed(1)),
    predictedAt: new Date().toISOString(),
    source: 'model-api',
  };
}

export async function scoreAttempt({ expectedWord, strokeCount = 0, durationMs = 8500 }) {
  const fakePayload = [{ id: 'legacy', points: Array.from({ length: strokeCount }, () => ({ x: 0, y: 0, t: 0 })) }];
  const result = await predictHandwriting({
    targetWord: expectedWord,
    strokePayload: fakePayload,
    durationMs,
  });

  return {
    expectedWord: result.targetWord,
    predictedWord: result.predictedWord,
    isCorrect: result.isCorrect,
    durationMs: result.durationMs,
    timeSeconds: result.timeSeconds,
  };
}
