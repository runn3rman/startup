import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { Home } from './home/home';
import { Play } from './play/play';
import { Scores } from './scores/scores';
import { About } from './about/about';
import { Practice } from './practice/practice';
import { Leaderboards } from './leaderboards/leaderboards';
import { Login } from './login/login';

export default function App() {
  return (
    <BrowserRouter>
      <div className="body">
        <header>
          <h1>Ink</h1>
        </header>

        <nav id="main-nav">
          <NavLink className="nav-link" to="/">
            Home
          </NavLink>
          <NavLink className="nav-link" to="/play">
            Play
          </NavLink>
          <NavLink className="nav-link" to="/practice">
            Practice
          </NavLink>
          <NavLink className="nav-link" to="/scores">
            Scores
          </NavLink>
          <NavLink className="nav-link" to="/leaderboards">
            Leaderboards
          </NavLink>
          <NavLink className="nav-link" to="/about">
            About
          </NavLink>
          <NavLink className="nav-link" to="/login">
            Login
          </NavLink>
          <a className="nav-link" href="https://github.com/runn3rman/startup" rel="noopener noreferrer">
            GitHub Repo
          </a>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <main>
                <Home />
              </main>
            }
          />
          <Route path="/play" element={<Play />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer>
          <p>Grant Gardner</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <main>
      <section>
        <h2>404</h2>
        <p>Page not found.</p>
      </section>
    </main>
  );
}
