import React from 'react';
import { useNavigate } from 'react-router-dom';
import './play.css';
import { leaderboardService, liveEventsService, scoringService, wordService } from '../services';
import { DrawingPad } from '../components/DrawingPad';

const ROUND_PHASES = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  ACTIVE: 'active',
  SUBMITTED: 'submitted',
  RESULT: 'result',
};

const MAX_ROUND_SECONDS = 10;

export function Play({ currentUser }) {
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
  }, [roundPhase]);

  React.useEffect(() => {
    if (roundPhase !== ROUND_PHASES.ACTIVE) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime((current) => {
        const next = Number((current + 0.1).toFixed(1));
        if (next >= MAX_ROUND_SECONDS) {
          setRoundPhase(ROUND_PHASES.SUBMITTED);
          return MAX_ROUND_SECONDS;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [roundPhase]);

  React.useEffect(() => {
    const unsubscribe = liveEventsService.subscribeToLiveEvents((event) => {
      setFeed((current) => [event, ...current].slice(0, 6));
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (roundPhase !== ROUND_PHASES.SUBMITTED) {
      return;
    }

    let cancelled = false;

    async function finalizeRound() {
      if (!currentUser) {
        navigate('/login');
        setRoundPhase(ROUND_PHASES.IDLE);
        return;
      }

      const strokeCount = strokeData.reduce((count, stroke) => count + stroke.points.length, 0);
      const outcome = await scoringService.scoreAttempt({
        expectedWord: wordData.word,
        strokeCount,
        durationMs: Math.round(elapsedTime * 1000),
      });
      if (cancelled) {
        return;
      }

      setResult(outcome);
      await leaderboardService.addAttempt({
        player: currentUser.username,
        word: outcome.expectedWord,
        isCorrect: outcome.isCorrect,
        durationMs: outcome.durationMs,
      });
      if (cancelled) {
        return;
      }

      setRoundPhase(ROUND_PHASES.RESULT);
    }

    finalizeRound();

    return () => {
      cancelled = true;
    };
  }, [roundPhase, currentUser, navigate, strokeData, wordData.word, elapsedTime]);

  function handleSubmit() {
    if (roundPhase !== ROUND_PHASES.ACTIVE) {
      return;
    }

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setRoundPhase(ROUND_PHASES.SUBMITTED);
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
          <strong>Time:</strong> {elapsedTime.toFixed(1)}s / {MAX_ROUND_SECONDS.toFixed(1)}s
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
          <li>Correct: {result ? (result.isCorrect ? 'Yes' : 'No') : '--'}</li>
          <li>Time: {result ? `${result.timeSeconds}s` : '--'}</li>
        </ul>
      </section>

      <section>
        <h3>Live Feed</h3>
        <ul>
          {feed.map((event) => (
            <li key={event.id}>
              {event.type === 'newRecord'
                ? `${event.player} set a new record on "${event.word}" at ${event.timeSeconds}s`
                : `${event.player} finished "${event.word}" in ${event.timeSeconds}s (${event.isCorrect ? 'correct' : 'incorrect'})`}
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
