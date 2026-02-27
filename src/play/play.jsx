import React from 'react';
import { useNavigate } from 'react-router-dom';
import './play.css';
import { leaderboardService, liveEventsService, wordService } from '../services';
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
  const typedInputRef = React.useRef(null);
  const [roundPhase, setRoundPhase] = React.useState(ROUND_PHASES.IDLE);
  const [wordData, setWordData] = React.useState({ word: '--' });
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [typedWord, setTypedWord] = React.useState('');
  const [clearSignal, setClearSignal] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [feed, setFeed] = React.useState([]);
  const [isWordLoading, setIsWordLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [roundError, setRoundError] = React.useState('');
  const [timerBeat, setTimerBeat] = React.useState(false);
  const [resultFlash, setResultFlash] = React.useState(false);

  React.useEffect(() => {
    if (roundPhase !== ROUND_PHASES.COUNTDOWN) {
      return;
    }

    let cancelled = false;
    async function setupRound() {
      try {
        setIsWordLoading(true);
        setRoundError('');
        const nextWord = await wordService.getNextWord();
        if (cancelled) {
          return;
        }

        setWordData(nextWord);
        setResult(null);
        setTypedWord('');
        setClearSignal((current) => current + 1);
        setElapsedTime(0);
        setRoundPhase(ROUND_PHASES.ACTIVE);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setRoundError(error.message || 'Failed to load word');
        setRoundPhase(ROUND_PHASES.IDLE);
      } finally {
        if (!cancelled) {
          setIsWordLoading(false);
        }
      }
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
      setTimerBeat((current) => !current);
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

      setIsSubmitting(true);
      setRoundError('');
      const submittedWord = typedWord.trim();
      const targetWord = wordData.word.trim();
      const outcome = {
        targetWord,
        predictedWord: submittedWord,
        isCorrect: submittedWord.toLowerCase() === targetWord.toLowerCase(),
        durationMs: Math.round(elapsedTime * 1000),
        timeSeconds: Number(elapsedTime.toFixed(1)),
      };
      if (cancelled) {
        return;
      }

      setResult(outcome);
      await leaderboardService.addAttempt({
        player: currentUser.username,
        word: outcome.targetWord,
        isCorrect: outcome.isCorrect,
        durationMs: outcome.durationMs,
      });
      if (cancelled) {
        return;
      }
      setIsSubmitting(false);
      setRoundPhase(ROUND_PHASES.RESULT);
    }

    finalizeRound();

    return () => {
      cancelled = true;
      setIsSubmitting(false);
    };
  }, [roundPhase, currentUser, navigate, typedWord, wordData.word, elapsedTime]);

  React.useEffect(() => {
    if (!result) {
      return;
    }

    setResultFlash(true);
    const timeout = setTimeout(() => setResultFlash(false), 350);
    return () => clearTimeout(timeout);
  }, [result]);

  React.useEffect(() => {
    if (roundPhase === ROUND_PHASES.ACTIVE) {
      typedInputRef.current?.focus();
    }
  }, [roundPhase]);

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
    setTypedWord('');
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
      <div className="play-layout">
        <section className="play-main">
          <div className="play-word-wrap">
            {(roundPhase === ROUND_PHASES.ACTIVE || roundPhase === ROUND_PHASES.SUBMITTED || roundPhase === ROUND_PHASES.RESULT) && (
              <p className="play-word">{wordData.word.toUpperCase()}</p>
            )}
            {isWordLoading ? <p>Loading next word...</p> : null}
            {roundError ? <p>{roundError}</p> : null}
            {(roundPhase === ROUND_PHASES.IDLE || roundPhase === ROUND_PHASES.RESULT) && (
              <button type="button" onClick={startRound} disabled={isWordLoading || isSubmitting}>
                Start
              </button>
            )}
          </div>

          <p className={timerBeat && roundPhase === ROUND_PHASES.ACTIVE ? 'play-timer-beat' : ''}>
            <strong>Time:</strong> {elapsedTime.toFixed(1)}s / {MAX_ROUND_SECONDS.toFixed(1)}s
          </p>

          {roundPhase === ROUND_PHASES.ACTIVE || roundPhase === ROUND_PHASES.SUBMITTED || roundPhase === ROUND_PHASES.RESULT ? (
            <div className="play-input-area">
              <div className="typing-panel">
                <label htmlFor="typed-word">Type the word</label>
                <input
                  ref={typedInputRef}
                  id="typed-word"
                  type="text"
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  disabled={roundPhase !== ROUND_PHASES.ACTIVE || isSubmitting}
                />
              </div>
              <DrawingPad width={600} height={300} clearSignal={clearSignal} />
            </div>
          ) : (
            <p></p>
          )}
          <div>
            <button type="button" onClick={clearCanvas} disabled={roundPhase !== ROUND_PHASES.ACTIVE}>
              Clear
            </button>
            <button type="button" onClick={handleSubmit} disabled={roundPhase !== ROUND_PHASES.ACTIVE || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Attempt'}
            </button>
          </div>
          {!currentUser ? <p>Login required to submit.</p> : null}

          <section className={resultFlash ? 'play-result-flash' : ''}>
            <h3>Results</h3>
            {isSubmitting ? <p>Checking result...</p> : null}
            {!isSubmitting && !result ? <p>No attempt submitted yet.</p> : null}
            {result ? (
              <ul>
                <li>Submitted word: {result.predictedWord || '--'}</li>
                <li>Correct: {result.isCorrect ? 'Yes' : 'No'}</li>
                <li>Time: {result.timeSeconds}s</li>
              </ul>
            ) : null}
          </section>
        </section>

        <section className="play-feed">
          <h3>Live Feed</h3>
          {feed.length === 0 ? <p>No live events yet.</p> : null}
          {feed.length > 0 ? (
            <ul>
              {feed.map((event) => (
                <li key={event.id}>
                  {event.type === 'newRecord'
                    ? `${event.player} set a new record on "${event.word}" at ${event.timeSeconds}s`
                    : `${event.player} finished "${event.word}" in ${event.timeSeconds}s (${event.isCorrect ? 'correct' : 'incorrect'})`}
                </li>
              ))}
            </ul>
          ) : null}
          <p>Mock source: setInterval</p>
        </section>
      </div>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
