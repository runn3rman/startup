import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { Home } from './home/home';

export default function App() {
  return (
    <div className="body">
      <header>
        <h1>Ink</h1>
      </header>

      <nav id="main-nav">
        <a className="nav-link" href="/index.html">
          Home
        </a>
        <a className="nav-link" href="/pages/game.html">
          Game
        </a>
        <a className="nav-link" href="/pages/practice.html">
          Practice
        </a>
        <a className="nav-link" href="/pages/leaderboards.html">
          Leaderboards
        </a>
        <a className="nav-link" href="/pages/login.html">
          Login
        </a>
        <a className="nav-link" href="/pages/about.html">
          About
        </a>
        <a className="nav-link" href="https://github.com/runn3rman/startup" rel="noopener noreferrer">
          GitHub Repo
        </a>
      </nav>

      <main>
        <Home />
      </main>

      <footer>
        <p>Grant Gardner</p>
      </footer>
    </div>
  );
}
