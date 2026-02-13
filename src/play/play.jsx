import React from 'react';
import './play.css';

export function Play() {
  return (
    <main className="play-page">
      <h2>Game</h2>
      <section>
        <p>
          <strong>Word:</strong> EXAMPLE
        </p>
        <p>
          <strong>Time left:</strong> 08.5s
        </p>
      </section>

      <section>
        <canvas width="600" height="300"></canvas>
        <div>
          <button type="button">Clear</button>
          <button type="button">Submit Attempt</button>
        </div>
      </section>

      <section>
        <h3>Results</h3>
        <ul>
          <li>Accuracy score: --</li>
          <li>Speed score: --</li>
          <li>Total score: --</li>
        </ul>
      </section>

      <section>
        <h3>Live Feed (WebSocket Placeholder)</h3>
        <ul>
          <li>Seth finished "planet" in 4.2s (92%)</li>
          <li>Mia finished "orbit" in 4.8s (94%)</li>
          <li>Avery set a new record on "echo" at 4.1s (96%)</li>
        </ul>
        <p>WebSocket will push events: attemptFinished, newRecord</p>
      </section>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
