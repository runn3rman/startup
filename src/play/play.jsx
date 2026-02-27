import React from 'react';
import { useNavigate } from 'react-router-dom';
import './play.css';
import { leaderboardService, liveEventsService, scoringService, wordService } from '../services';
import { DrawingPad } from '../components/DrawingPad';

export function Play({ currentUser }) {
  const navigate = useNavigate();
  const [wordData, setWordData] = React.useState({ word: 'loading...' });
  const [timeLeft, setTimeLeft] = React.useState(8.5);
  const [strokeData, setStrokeData] = React.useState([]);
  const [clearSignal, setClearSignal] = React.useState(0);
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
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const strokeCount = strokeData.reduce((count, stroke) => count + stroke.points.length, 0);
    const score = await scoringService.scoreAttempt({
      expectedWord: wordData.word,
      strokeCount,
      durationMs: Math.round((8.5 - timeLeft) * 1000),
    });
    setResult(score);
    await leaderboardService.addAttempt({
      player: currentUser.username,
      word: score.expectedWord,
      accuracy: score.accuracy,
      durationMs: score.durationMs,
      score: score.totalScore,
    });
  }

  function clearCanvas() {
    setClearSignal((current) => current + 1);
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
        <DrawingPad width={600} height={300} clearSignal={clearSignal} onStrokeDataChange={setStrokeData} />
        <div>
          <button type="button" onClick={clearCanvas}>
            Clear
          </button>
          <button type="button" onClick={handleSubmit}>
            Submit Attempt
          </button>
        </div>
        {!currentUser ? <p>Login required to submit.</p> : null}
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
