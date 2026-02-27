import React from 'react';
import './play.css';
import { leaderboardService, liveEventsService, scoringService, wordService } from '../services';

export function Play() {
  const [wordData, setWordData] = React.useState({ word: 'loading...' });
  const [timeLeft, setTimeLeft] = React.useState(8.5);
  const [strokeCount, setStrokeCount] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [feed, setFeed] = React.useState([]);

  React.useEffect(() => {
    wordService.getNextWord().then(setWordData);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((current) => (current > 0.1 ? Number((current - 0.1).toFixed(1)) : 0));
    }, 100);

    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const unsubscribe = liveEventsService.subscribeToLiveEvents((event) => {
      setFeed((current) => [event, ...current].slice(0, 6));
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit() {
    const score = await scoringService.scoreAttempt({
      expectedWord: wordData.word,
      strokeCount,
      durationMs: Math.round((8.5 - timeLeft) * 1000),
    });
    setResult(score);
    await leaderboardService.addAttempt({
      player: 'Guest',
      word: score.expectedWord,
      accuracy: score.accuracy,
      durationMs: score.durationMs,
      score: score.totalScore,
    });
  }

  function clearCanvas() {
    setStrokeCount(0);
    setResult(null);
  }

  return (
    <main className="play-page">
      <h2>Game</h2>
      <section>
        <p>
          <strong>Word:</strong> {wordData.word.toUpperCase()}
        </p>
        <p>
          <strong>Time left:</strong> {timeLeft.toFixed(1)}s
        </p>
      </section>

      <section>
        <canvas
          width="600"
          height="300"
          onPointerDown={() => setStrokeCount((current) => current + 1)}
        ></canvas>
        <div>
          <button type="button" onClick={clearCanvas}>
            Clear
          </button>
          <button type="button" onClick={handleSubmit}>
            Submit Attempt
          </button>
        </div>
      </section>

      <section>
        <h3>Results</h3>
        <ul>
          <li>Predicted word: {result?.predictedWord || '--'}</li>
          <li>Accuracy score: {result ? `${result.accuracy}%` : '--'}</li>
          <li>Speed score: {result?.speedScore ?? '--'}</li>
          <li>Total score: {result?.totalScore ?? '--'}</li>
        </ul>
      </section>

      <section>
        <h3>Live Feed</h3>
        <ul>
          {feed.map((event) => (
            <li key={event.id}>
              {event.type === 'newRecord'
                ? `${event.player} set a new record on "${event.word}" at ${event.timeSeconds}s (${event.accuracy}%)`
                : `${event.player} finished "${event.word}" in ${event.timeSeconds}s (${event.accuracy}%)`}
            </li>
          ))}
        </ul>
        <p>Mock source: setInterval</p>
      </section>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
