import React from 'react';

export function Leaderboards() {
  return (
    <main>
      <h2>Leaderboards</h2>
      <section>
        <h3>Global Top 10</h3>
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Word</th>
              <th scope="col">Accuracy</th>
              <th scope="col">Time</th>
              <th scope="col">Score</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Avery</td>
              <td>Velocity</td>
              <td>98%</td>
              <td>6.2s</td>
              <td>980</td>
              <td>2026-01-20</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Jay</td>
              <td>Orbit</td>
              <td>97%</td>
              <td>6.7s</td>
              <td>955</td>
              <td>2026-01-19</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Grant</td>
              <td>Echo</td>
              <td>96%</td>
              <td>6.9s</td>
              <td>942</td>
              <td>2026-01-18</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
