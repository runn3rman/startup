import React from 'react';
import './scores.css';
import { leaderboardService } from '../services';

export function Scores() {
  const [globalTop, setGlobalTop] = React.useState([]);
  const [friendsTop, setFriendsTop] = React.useState([]);
  const [bestByWord, setBestByWord] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  async function load() {
    try {
      setIsLoading(true);
      setLoadError('');
      const [globalData, friendsData, wordsData] = await Promise.all([
        leaderboardService.getGlobalTop(),
        leaderboardService.getFriendsTop(),
        leaderboardService.getBestByWord(),
      ]);
      setGlobalTop(globalData);
      setFriendsTop(friendsData);
      setBestByWord(wordsData);
    } catch (error) {
      setGlobalTop([]);
      setFriendsTop([]);
      setBestByWord([]);
      setLoadError(error.message || 'Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <main className="scores-page">
      <h2>Leaderboards</h2>
      <section>
        <button type="button" onClick={load} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
        {loadError ? <p>{loadError}</p> : null}
      </section>
      <section>
        <h3>Global Top 10</h3>
        {!isLoading && globalTop.length === 0 ? <p>No global attempts yet.</p> : null}
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Word</th>
              <th scope="col">Correct</th>
              <th scope="col">Time</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {globalTop.map((row) => (
              <tr key={row.id}>
                <td>{row.rank}</td>
                <td>{row.player}</td>
                <td>{row.word}</td>
                <td>{row.isCorrect ? 'Yes' : 'No'}</td>
                <td>{row.timeSeconds}s</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Friends Top 10</h3>
        {!isLoading && friendsTop.length === 0 ? <p>No friend attempts yet.</p> : null}
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Word</th>
              <th scope="col">Correct</th>
              <th scope="col">Time</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {friendsTop.map((row) => (
              <tr key={row.id}>
                <td>{row.rank}</td>
                <td>{row.player}</td>
                <td>{row.word}</td>
                <td>{row.isCorrect ? 'Yes' : 'No'}</td>
                <td>{row.timeSeconds}s</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Best Times by Word</h3>
        {!isLoading && bestByWord.length === 0 ? <p>No best-word records yet.</p> : null}
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Word</th>
              <th scope="col">Correct</th>
              <th scope="col">Time</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {bestByWord.map((row) => (
              <tr key={row.word}>
                <td>{row.rank}</td>
                <td>{row.player}</td>
                <td>{row.word}</td>
                <td>{row.isCorrect ? 'Yes' : 'No'}</td>
                <td>{row.timeSeconds}s</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Database Stored Data (Placeholder)</h3>
        <pre>{`{
  "user": {
    "id": "u_1024",
    "username": "Grant",
    "email": "grant@example.com",
    "createdAt": "2026-01-15T18:22:11Z"
  },
  "attempt": {
    "id": "a_5581",
    "userId": "u_1024",
    "word": "Velocity",
    "isCorrect": true,
    "timeSeconds": 6.2,
    "createdAt": "2026-01-20T21:05:44Z"
  },
  "leaderboard": {
    "id": "l_9001",
    "rank": 1,
    "userId": "u_1024",
    "word": "Velocity",
    "isCorrect": true,
    "timeSeconds": 6.2,
    "createdAt": "2026-01-20T21:06:01Z"
  }
}`}</pre>
        <p>This will come from /api/leaderboard and /api/attempts</p>
      </section>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
