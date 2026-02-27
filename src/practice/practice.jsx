import React from 'react';
import { useNavigate } from 'react-router-dom';
import { wordService } from '../services';
import { DrawingPad } from '../components/DrawingPad';
import './practice.css';

const PRACTICE_PHASES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  SUBMITTED: 'submitted',
  RESULT: 'result',
};

const MAX_PRACTICE_SECONDS = 20;

export function Practice({ currentUser }) {
  const navigate = useNavigate();
  const [wordSet, setWordSet] = React.useState('easy');
  const [customWords, setCustomWords] = React.useState('');
  const [words, setWords] = React.useState([]);
  const [wordIndex, setWordIndex] = React.useState(0);
  const [definition, setDefinition] = React.useState('');
  const [activeWord, setActiveWord] = React.useState('');
  const [roundPhase, setRoundPhase] = React.useState(PRACTICE_PHASES.IDLE);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [typedWord, setTypedWord] = React.useState('');
  const [strokeData, setStrokeData] = React.useState([]);
  const [clearSignal, setClearSignal] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [isWordsLoading, setIsWordsLoading] = React.useState(false);
  const [wordsError, setWordsError] = React.useState('');
  const [isDefinitionLoading, setIsDefinitionLoading] = React.useState(false);
  const [definitionError, setDefinitionError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultFlash, setResultFlash] = React.useState(false);
  const [timerBeat, setTimerBeat] = React.useState(false);

  function parseCustomWords(value) {
    return value
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean);
  }

  React.useEffect(() => {
    async function loadWords() {
      try {
        setIsWordsLoading(true);
        setWordsError('');
        if (wordSet === 'custom') {
          const parsed = parseCustomWords(customWords);
          setWords(parsed);
          setWordIndex(0);
          return;
        }

        const data = await wordService.getPracticeWords(wordSet);
        setWords(data.words);
        setWordIndex(0);
      } catch (error) {
        setWords([]);
        setWordIndex(0);
        setWordsError(error.message || 'Failed to load words');
      } finally {
        setIsWordsLoading(false);
      }
    }

    loadWords();
  }, [wordSet]);

  React.useEffect(() => {
    setActiveWord(words[wordIndex] || '');
  }, [words, wordIndex]);

  React.useEffect(() => {
    if (roundPhase !== PRACTICE_PHASES.ACTIVE) {
      return;
    }

    const timer = setInterval(() => {
      setTimerBeat((current) => !current);
      setElapsedTime((current) => {
        const next = Number((current + 0.1).toFixed(1));
        if (next >= MAX_PRACTICE_SECONDS) {
          setRoundPhase(PRACTICE_PHASES.SUBMITTED);
          return MAX_PRACTICE_SECONDS;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [roundPhase]);

  React.useEffect(() => {
    if (roundPhase !== PRACTICE_PHASES.SUBMITTED) {
      return;
    }

    if (!currentUser) {
      navigate('/login');
      setRoundPhase(PRACTICE_PHASES.IDLE);
      return;
    }

    setIsSubmitting(true);
    const typed = typedWord.trim();
    const target = activeWord.trim();
    setResult({
      targetWord: target,
      predictedWord: typed,
      isCorrect: typed.toLowerCase() === target.toLowerCase(),
      timeSeconds: Number(elapsedTime.toFixed(1)),
      strokeCount: strokeData.length,
    });
    setIsSubmitting(false);
    setRoundPhase(PRACTICE_PHASES.RESULT);
  }, [roundPhase, currentUser, navigate, typedWord, activeWord, elapsedTime, strokeData.length]);

  React.useEffect(() => {
    if (!result) {
      return;
    }
    setResultFlash(true);
    const timeout = setTimeout(() => setResultFlash(false), 350);
    return () => clearTimeout(timeout);
  }, [result]);

  function startPracticeRound() {
    if (!activeWord) {
      return;
    }
    setElapsedTime(0);
    setTypedWord('');
    setResult(null);
    setWordsError('');
    setDefinitionError('');
    setStrokeData([]);
    setClearSignal((current) => current + 1);
    setRoundPhase(PRACTICE_PHASES.ACTIVE);
  }

  function submitPracticeRound() {
    if (roundPhase !== PRACTICE_PHASES.ACTIVE) {
      return;
    }
    setRoundPhase(PRACTICE_PHASES.SUBMITTED);
  }

  function clearAttempt() {
    if (roundPhase !== PRACTICE_PHASES.ACTIVE) {
      return;
    }
    setTypedWord('');
    setStrokeData([]);
    setClearSignal((current) => current + 1);
    setResult(null);
  }

  function nextWord() {
    if (words.length === 0) {
      return;
    }
    setWordIndex((current) => (current + 1) % words.length);
    setDefinition('');
    setElapsedTime(0);
    setTypedWord('');
    setStrokeData([]);
    setClearSignal((current) => current + 1);
    setResult(null);
    setRoundPhase(PRACTICE_PHASES.IDLE);
  }

  function applyCustomWords() {
    const parsed = parseCustomWords(customWords);
    setWords(parsed);
    setWordIndex(0);
    setDefinition('');
    setRoundPhase(PRACTICE_PHASES.IDLE);
    setResult(null);
    setWordsError(parsed.length === 0 ? 'Enter at least one custom word.' : '');
  }

  async function handleGetDefinition() {
    if (!activeWord) {
      setDefinition('');
      return;
    }
    try {
      setIsDefinitionLoading(true);
      setDefinitionError('');
      const data = await wordService.getDefinition(activeWord);
      setDefinition(data.definition);
    } catch (error) {
      setDefinition('');
      setDefinitionError(error.message || 'Failed to load definition');
    } finally {
      setIsDefinitionLoading(false);
    }
  }

  return (
    <main>
      <h2>Practice</h2>
      <section>
        <label htmlFor="word-set">Word set</label>
        <select id="word-set" name="wordSet" value={wordSet} onChange={(e) => setWordSet(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="custom">Custom</option>
        </select>
        {isWordsLoading ? <p>Loading words...</p> : null}
        {wordsError ? <p>{wordsError}</p> : null}
        <p>Phase: {roundPhase}</p>
        <p>
          Active word: {activeWord || 'none'} {words.length > 0 ? `( ${wordIndex + 1}/${words.length} )` : ''}
        </p>
        <p className={timerBeat && roundPhase === PRACTICE_PHASES.ACTIVE ? 'practice-timer-beat' : ''}>
          Time: {elapsedTime.toFixed(1)}s / {MAX_PRACTICE_SECONDS.toFixed(1)}s
        </p>
        {wordSet !== 'custom' && words.length > 0 ? <p>Word bank: {words.join(', ')}</p> : null}
        {words.length === 0 && !isWordsLoading ? <p>No words available for this set.</p> : null}
        <div>
          <button
            type="button"
            onClick={startPracticeRound}
            disabled={!activeWord || roundPhase === PRACTICE_PHASES.ACTIVE || isWordsLoading || isSubmitting}
          >
            Start Round
          </button>
          <button type="button" onClick={submitPracticeRound} disabled={roundPhase !== PRACTICE_PHASES.ACTIVE || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button type="button" onClick={nextWord} disabled={words.length === 0 || isWordsLoading}>
            Next Word
          </button>
        </div>
      </section>

      <section>
        <label htmlFor="custom-words">Add custom words</label>
        <input
          id="custom-words"
          name="customWords"
          type="text"
          placeholder="word1, word2, word3"
          value={customWords}
          onChange={(e) => setCustomWords(e.target.value)}
        />
        <button type="button" onClick={applyCustomWords} disabled={wordSet !== 'custom'}>
          Apply Custom Words
        </button>
      </section>

      <section>
        <button type="button" onClick={handleGetDefinition} disabled={!activeWord || isDefinitionLoading}>
          {isDefinitionLoading ? 'Loading definition...' : 'Get definition'}
        </button>
        <p>{definition || 'No definition loaded.'}</p>
        {definitionError ? <p>{definitionError}</p> : null}
      </section>

      <section>
        <h3>3rd-Party Services (Placeholder)</h3>
        <ul>
          <li>Random word API</li>
          <li>Dictionary/definition API</li>
          <li>Optional sponsorship/ad provider later</li>
        </ul>
        <p>Flow: request a random word, pull a definition for that word, then render both in the practice UI.</p>
        <img src="/images/word-card.svg" alt="Example word prompt card labeled VELOCITY" />
      </section>

      <section className={resultFlash ? 'practice-result-flash' : ''}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <DrawingPad width={600} height={300} clearSignal={clearSignal} onStrokeDataChange={setStrokeData} />
          <div style={{ minWidth: '220px' }}>
            <label htmlFor="practice-typed-word">Type the word</label>
            <input
              id="practice-typed-word"
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              disabled={roundPhase !== PRACTICE_PHASES.ACTIVE || isSubmitting}
            />
          </div>
        </div>
        <div>
          <button type="button" onClick={clearAttempt} disabled={roundPhase !== PRACTICE_PHASES.ACTIVE || isSubmitting}>
            Clear
          </button>
        </div>
        {!currentUser ? <p>Login required to submit.</p> : null}
        {isSubmitting ? <p>Checking result...</p> : null}
        {!isSubmitting && !result ? <p>No attempt submitted yet.</p> : null}
        {result ? <p>Submitted word: {result.predictedWord || '--'}</p> : null}
        {result ? <p>Correct: {result.isCorrect ? 'Yes' : 'No'}</p> : null}
        {result ? <p>Time: {result.timeSeconds}s</p> : null}
      </section>
    </main>
  );
}
