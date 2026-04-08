import React from 'react';

export function Home() {
  return (
    <>
      <section>
        <h2>What is Ink?</h2>
        <p>
          Ink is a speed handwriting game where you race friends to write words fast and correctly. Your best times
          will help you climb the global leaderboard.
        </p>
        <p>
          Built by <strong>Grant Gardner</strong>. View the source on{' '}
          <a href="https://github.com/runn3rman/startup" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
        <img src="/images/ink-logo.svg" alt="Ink logo mock with an ink droplet" />
      </section>

      <section>
        <h2>Key features</h2>
        <ul>
          <li>Timed rounds</li>
          <li>Correct/incorrect checks</li>
          <li>Leaderboards</li>
          <li>Practice mode</li>
          <li>Realtime attempts</li>
        </ul>
      </section>

      <section>
        <h2>How it works</h2>
        <ol>
          <li>Start a round and type the target word as fast as you can</li>
          <li>The app checks if the word is correct</li>
          <li>Results show up on the leaderboard</li>
        </ol>
      </section>
    </>
  );
}
