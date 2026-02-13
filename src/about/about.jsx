import React from 'react';
import './about.css';

export function About() {
  return (
    <main className="about-page">
      <h2>About</h2>
      <section>
        <h3>Monetization</h3>
        <ul>
          <li>Skins for the canvas and UI</li>
          <li>Collectible pets</li>
          <li>Sponsorships and seasonal events</li>
        </ul>
      </section>

      <section>
        <h3>Educational expansion</h3>
        <p>
          Ink can support handwriting practice for classrooms and language learners with curated word sets, feedback,
          and progress tracking.
        </p>
      </section>

      <section>
        <h3>Tech plan</h3>
        <ul>
          <li>
            <strong>HTML</strong> for structure, forms, and canvas
          </li>
          <li>
            <strong>CSS</strong> for responsive layout and visuals
          </li>
          <li>
            <strong>React</strong> for routing and interactive components
          </li>
          <li>
            <strong>Service</strong> for login, word selection, and scoring
          </li>
          <li>
            <strong>DB</strong> for users, attempts, and leaderboards
          </li>
          <li>
            <strong>WebSocket</strong> for live attempt and record updates
          </li>
        </ul>
      </section>

      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
