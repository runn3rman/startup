import { apiGet, apiPost } from './apiClient';

export async function getGlobalTop(limit = 10) {
  const rows = await apiGet('/api/leaderboards/global', 'Failed to load global leaderboard');
  return rows.slice(0, limit);
}

export async function getFriendsTop(limit = 10) {
  const rows = await apiGet('/api/leaderboards/friends', 'Failed to load friends leaderboard');
  return rows.slice(0, limit);
}

export async function getBestByWord() {
  return apiGet('/api/leaderboards/words', 'Failed to load word leaderboard');
}

export async function addAttempt({ player, word, isCorrect, durationMs }) {
  const body = await apiPost(
    '/api/attempts',
    {
      player,
      targetWord: word,
      isCorrect,
      durationMs,
    },
    'Failed to save attempt'
  );

  return body.attempt;
}

export async function getAttempts() {
  const body = await apiGet('/api/attempts/me', 'Failed to load attempts');
  return body.attempts;
}

export async function getMyAttemptSummary() {
  return apiGet('/api/attempts/me', 'Failed to load attempts');
}
