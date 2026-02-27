import React from 'react';
import { useNavigate } from 'react-router-dom';
import { scoringService, wordService } from '../services';
import { DrawingPad } from '../components/DrawingPad';

export function Practice({ currentUser }) {
  const navigate = useNavigate();
  const [wordSet, setWordSet] = React.useState('easy');
  const [customWords, setCustomWords] = React.useState('');
  const [words, setWords] = React.useState([]);
  const [definition, setDefinition] = React.useState('');
  const [activeWord, setActiveWord] = React.useState('');
  const [strokeData, setStrokeData] = React.useState([]);
  const [clearSignal, setClearSignal] = React.useState(0);
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    wordService.getPracticeWords(wordSet).then((data) => {
      setWords(data.words);
      setActiveWord(data.words[0] || '');
    });
  }, [wordSet]);

  async function handleGetDefinition() {
    const targetWord = activeWord || words[0];
    if (!targetWord) {
      setDefinition('');
      return;
    }
    const data = await wordService.getDefinition(targetWord);
    setDefinition(data.definition);
  }

  async function handleSubmitAttempt() {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const strokeCount = strokeData.reduce((count, stroke) => count + stroke.points.length, 0);
    const score = await scoringService.scoreAttempt({
      expectedWord: activeWord || words[0] || 'word',
      strokeCount,
      durationMs: 7000,
    });
    setResult(score);
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
        <p>Active word: {activeWord || 'none'}</p>
        {wordSet !== 'custom' ? <p>Word bank: {words.join(', ')}</p> : null}
      </section>

      <section>
        <label htmlFor="custom-words">Add custom words</label>
        <input
          id="custom-words"
          name="customWords"
          type="text"
          placeholder="word1, word2, word3"
          value={customWords}
          onChange={(e) => {
            const value = e.target.value;
            setCustomWords(value);
            if (wordSet === 'custom') {
              const parsed = value
                .split(',')
                .map((word) => word.trim())
                .filter(Boolean);
              setWords(parsed);
              setActiveWord(parsed[0] || '');
            }
          }}
        />
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
        <DrawingPad width={600} height={300} clearSignal={clearSignal} onStrokeDataChange={setStrokeData} />
        <div>
          <button
            type="button"
            onClick={() => {
              setClearSignal((current) => current + 1);
              setResult(null);
            }}
          >
            Clear
          </button>
          <button type="button" onClick={handleSubmitAttempt}>
            Submit Attempt
          </button>
        </div>
        {!currentUser ? <p>Login required to submit.</p> : null}
        <p>Practice score: {result?.totalScore ?? '--'}</p>
      </section>
    </main>
  );
}
