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
          <li>Write a word on the canvas</li>
          <li>The model checks if the word is correct</li>
          <li>Results show up on the leaderboard</li>
        </ol>
      </section>
    </>
  );
}
