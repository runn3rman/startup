import React from 'react';
import '../scores/scores.css';
import { leaderboardService } from '../services';

export function Leaderboards() {
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
                <td>{row.timeSeconds}s</td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Best Times By Word</h3>
        {!isLoading && bestByWord.length === 0 ? <p>No records yet.</p> : null}
        <table>
          <thead>
            <tr>
              <th scope="col">Word</th>
              <th scope="col">Player</th>
              <th scope="col">Time</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {bestByWord.map((row) => (
              <tr key={row.word}>
                <td>{row.word}</td>
                <td>{row.player}</td>
                <td>{row.timeSeconds}s</td>
                <td>{row.date}</td>
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
