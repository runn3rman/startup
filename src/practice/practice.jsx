import React from 'react';
import { useNavigate } from 'react-router-dom';
import { wordService } from '../services';
import { DrawingPad } from '../components/DrawingPad';

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

  function parseCustomWords(value) {
    return value
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean);
  }

  React.useEffect(() => {
    async function loadWords() {
      if (wordSet === 'custom') {
        const parsed = parseCustomWords(customWords);
        setWords(parsed);
        setWordIndex(0);
        return;
      }

      const data = await wordService.getPracticeWords(wordSet);
      setWords(data.words);
      setWordIndex(0);
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

    const typed = typedWord.trim();
    const target = activeWord.trim();
    setResult({
      targetWord: target,
      predictedWord: typed,
      isCorrect: typed.toLowerCase() === target.toLowerCase(),
      timeSeconds: Number(elapsedTime.toFixed(1)),
      strokeCount: strokeData.length,
    });
    setRoundPhase(PRACTICE_PHASES.RESULT);
  }, [roundPhase, currentUser, navigate, typedWord, activeWord, elapsedTime, strokeData.length]);

  function startPracticeRound() {
    if (!activeWord) {
      return;
    }
    setElapsedTime(0);
    setTypedWord('');
    setResult(null);
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
  }

  async function handleGetDefinition() {
    if (!activeWord) {
      setDefinition('');
      return;
    }
    const data = await wordService.getDefinition(activeWord);
    setDefinition(data.definition);
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
        <p>Phase: {roundPhase}</p>
        <p>
          Active word: {activeWord || 'none'} {words.length > 0 ? `( ${wordIndex + 1}/${words.length} )` : ''}
        </p>
        <p>
          Time: {elapsedTime.toFixed(1)}s / {MAX_PRACTICE_SECONDS.toFixed(1)}s
        </p>
        {wordSet !== 'custom' ? <p>Word bank: {words.join(', ')}</p> : null}
        <div>
          <button type="button" onClick={startPracticeRound} disabled={!activeWord || roundPhase === PRACTICE_PHASES.ACTIVE}>
            Start Round
          </button>
          <button type="button" onClick={submitPracticeRound} disabled={roundPhase !== PRACTICE_PHASES.ACTIVE}>
            Submit
          </button>
          <button type="button" onClick={nextWord} disabled={words.length === 0}>
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
        <button type="button" onClick={handleGetDefinition}>
          Get definition
        </button>
        <p>{definition || 'No definition loaded.'}</p>
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

      <section>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <DrawingPad width={600} height={300} clearSignal={clearSignal} onStrokeDataChange={setStrokeData} />
          <div style={{ minWidth: '220px' }}>
            <label htmlFor="practice-typed-word">Type the word</label>
            <input
              id="practice-typed-word"
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              disabled={roundPhase !== PRACTICE_PHASES.ACTIVE}
            />
          </div>
        </div>
        <div>
          <button type="button" onClick={clearAttempt} disabled={roundPhase !== PRACTICE_PHASES.ACTIVE}>
            Clear
          </button>
        </div>
        {!currentUser ? <p>Login required to submit.</p> : null}
        <p>Submitted word: {result?.predictedWord || '--'}</p>
        <p>Correct: {result ? (result.isCorrect ? 'Yes' : 'No') : '--'}</p>
        <p>Time: {result ? `${result.timeSeconds}s` : '--'}</p>
      </section>
    </main>
  );
}
