import React from 'react';
import { useNavigate } from 'react-router-dom';
import './play.css';
import { leaderboardService, liveEventsService, scoringService, wordService } from '../services';
import { DrawingPad } from '../components/DrawingPad';

export function Play({ currentUser }) {
  const ROUND_PHASES = {
    IDLE: 'idle',
    COUNTDOWN: 'countdown',
    ACTIVE: 'active',
    SUBMITTED: 'submitted',
    RESULT: 'result',
  };

  const navigate = useNavigate();
  const [roundPhase, setRoundPhase] = React.useState(ROUND_PHASES.IDLE);
  const [wordData, setWordData] = React.useState({ word: '--' });
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [strokeData, setStrokeData] = React.useState([]);
  const [clearSignal, setClearSignal] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [feed, setFeed] = React.useState([]);

  React.useEffect(() => {
    if (roundPhase !== ROUND_PHASES.COUNTDOWN) {
      return;
    }

    let cancelled = false;
    async function setupRound() {
      const nextWord = await wordService.getNextWord();
      if (cancelled) {
        return;
      }

      setWordData(nextWord);
      setResult(null);
      setStrokeData([]);
      setClearSignal((current) => current + 1);
      setElapsedTime(0);
      setRoundPhase(ROUND_PHASES.ACTIVE);
    }

    setupRound();

    return () => {
      cancelled = true;
    };
  }, [roundPhase, ROUND_PHASES.COUNTDOWN, ROUND_PHASES.ACTIVE]);

  React.useEffect(() => {
    if (roundPhase !== ROUND_PHASES.ACTIVE) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime((current) => Number((current + 0.1).toFixed(1)));
    }, 100);

    return () => clearInterval(timer);
  }, [roundPhase, ROUND_PHASES.ACTIVE]);

  React.useEffect(() => {
    const unsubscribe = liveEventsService.subscribeToLiveEvents((event) => {
      setFeed((current) => [event, ...current].slice(0, 6));
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit() {
    if (roundPhase !== ROUND_PHASES.ACTIVE) {
      return;
    }

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setRoundPhase(ROUND_PHASES.SUBMITTED);
    const strokeCount = strokeData.reduce((count, stroke) => count + stroke.points.length, 0);
    const score = await scoringService.scoreAttempt({
      expectedWord: wordData.word,
      strokeCount,
      durationMs: Math.round(elapsedTime * 1000),
    });
    setResult(score);
    await leaderboardService.addAttempt({
      player: currentUser.username,
      word: score.expectedWord,
      accuracy: score.accuracy,
      durationMs: score.durationMs,
      score: score.totalScore,
    });
    setRoundPhase(ROUND_PHASES.RESULT);
  }

  function clearCanvas() {
    if (roundPhase !== ROUND_PHASES.ACTIVE) {
      return;
    }

    setClearSignal((current) => current + 1);
    setStrokeData([]);
    setResult(null);
  }

  function startRound() {
    if (roundPhase !== ROUND_PHASES.IDLE && roundPhase !== ROUND_PHASES.RESULT) {
      return;
    }
    setRoundPhase(ROUND_PHASES.COUNTDOWN);
  }

  return (
    <main className="play-page">
      <h2>Game</h2>
      <section>
        <p>
          <strong>Phase:</strong> {roundPhase}
        </p>
        <p>
          <strong>Word:</strong> {wordData.word.toUpperCase()}
        </p>
        <p>
          <strong>Time:</strong> {elapsedTime.toFixed(1)}s
        </p>
        {(roundPhase === ROUND_PHASES.IDLE || roundPhase === ROUND_PHASES.RESULT) && (
          <button type="button" onClick={startRound}>
            Start Round
          </button>
        )}
      </section>

      <section>
        {roundPhase === ROUND_PHASES.ACTIVE || roundPhase === ROUND_PHASES.SUBMITTED || roundPhase === ROUND_PHASES.RESULT ? (
          <DrawingPad width={600} height={300} clearSignal={clearSignal} onStrokeDataChange={setStrokeData} />
        ) : (
          <p>Press Start Round to begin.</p>
        )}
        <div>
          <button type="button" onClick={clearCanvas} disabled={roundPhase !== ROUND_PHASES.ACTIVE}>
            Clear
          </button>
          <button type="button" onClick={handleSubmit} disabled={roundPhase !== ROUND_PHASES.ACTIVE}>
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
