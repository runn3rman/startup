import React from 'react';
import './scores.css';
import { leaderboardService } from '../services';

export function Scores() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [myBestScores, setMyBestScores] = React.useState([]);
  const [myScoresByWord, setMyScoresByWord] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  React.useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  async function load() {
    if (!currentUser?.username) {
      setMyBestScores([]);
      setMyScoresByWord([]);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError('');
      const attempts = await leaderboardService.getAttempts();
      const myAttempts = attempts.filter((attempt) => attempt.player === currentUser.username);

      const bestScores = [...myAttempts]
        .filter((attempt) => attempt.isCorrect)
        .sort((a, b) => a.timeSeconds - b.timeSeconds)
        .slice(0, 10)
        .map((attempt, index) => ({ rank: index + 1, ...attempt }));

      const byWordMap = new Map();
      myAttempts.forEach((attempt) => {
        const key = attempt.word;
        const current = byWordMap.get(key);
        if (!current) {
          byWordMap.set(key, {
            word: key,
            attempts: 1,
            correctAttempts: attempt.isCorrect ? 1 : 0,
            bestTime: attempt.isCorrect ? attempt.timeSeconds : null,
            latestTime: attempt.timeSeconds,
          });
          return;
        }

        current.attempts += 1;
        current.correctAttempts += attempt.isCorrect ? 1 : 0;
        current.latestTime = attempt.timeSeconds;
        if (attempt.isCorrect && (current.bestTime === null || attempt.timeSeconds < current.bestTime)) {
          current.bestTime = attempt.timeSeconds;
        }
      });

      const byWord = Array.from(byWordMap.values()).sort((a, b) => a.word.localeCompare(b.word));

      setMyBestScores(bestScores);
      setMyScoresByWord(byWord);
    } catch (error) {
      setMyBestScores([]);
      setMyScoresByWord([]);
      setLoadError(error.message || 'Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [currentUser]);

  return (
    <main className="scores-page">
      <h2>My Scores</h2>
      <section>
        <p>Player: {currentUser?.username || 'Guest'}</p>
      </section>
      <section>
        <button type="button" onClick={load} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
        {loadError ? <p>{loadError}</p> : null}
      </section>
      <section>
        <h3>Best Scores</h3>
        {!currentUser?.username ? <p>Login to see your scores.</p> : null}
        {currentUser?.username && !isLoading && myBestScores.length === 0 ? <p>No correct attempts yet.</p> : null}
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Word</th>
              <th scope="col">Time</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {myBestScores.map((row) => (
              <tr key={row.id}>
                <td>{row.rank}</td>
                <td>{row.word}</td>
                <td>{row.timeSeconds}s</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Scores By Word</h3>
        {currentUser?.username && !isLoading && myScoresByWord.length === 0 ? <p>No attempts recorded yet.</p> : null}
        <table>
          <thead>
            <tr>
              <th scope="col">Word</th>
              <th scope="col">Attempts</th>
              <th scope="col">Correct</th>
              <th scope="col">Best Time</th>
              <th scope="col">Last Time</th>
            </tr>
          </thead>
          <tbody>
            {myScoresByWord.map((row) => (
              <tr key={row.word}>
                <td>{row.word}</td>
                <td>{row.attempts}</td>
                <td>{row.correctAttempts}</td>
                <td>{row.bestTime === null ? '--' : `${row.bestTime}s`}</td>
                <td>{row.latestTime}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
