import React from 'react';
import './scores.css';
import { leaderboardService } from '../services';

export function Scores({ currentUser }) {
  const [myBestScores, setMyBestScores] = React.useState([]);
  const [myScoresByWord, setMyScoresByWord] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  async function load() {
    if (!currentUser?.username) {
      setMyBestScores([]);
      setMyScoresByWord([]);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError('');
      const summary = await leaderboardService.getMyAttemptSummary();
      setMyBestScores(summary.bestScores || []);
      setMyScoresByWord(summary.byWord || []);
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
