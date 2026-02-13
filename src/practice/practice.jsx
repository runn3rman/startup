import React from 'react';

export function Practice() {
  return (
    <main>
      <h2>Practice</h2>
      <section>
        <label htmlFor="word-set">Word set</label>
        <select id="word-set" name="wordSet">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="custom">Custom</option>
        </select>
      </section>

      <section>
        <label htmlFor="custom-words">Add custom words</label>
        <input id="custom-words" name="customWords" type="text" placeholder="word1, word2, word3" />
      </section>

      <section>
        <button type="button">Get definition</button>
        <p>3rd-party dictionary API placeholder</p>
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
        <canvas width="600" height="300"></canvas>
        <div>
          <button type="button">Clear</button>
          <button type="button">Submit Attempt</button>
        </div>
      </section>
    </main>
  );
}
