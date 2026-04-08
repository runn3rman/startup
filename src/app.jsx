import React from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { Home } from './home/home';
import { Play } from './play/play';
import { Scores } from './scores/scores';
import { About } from './about/about';
import { Practice } from './practice/practice';
import { Leaderboards } from './leaderboards/leaderboards';
import { Login } from './login/login';
import { authService, liveEventsService } from './services';

export default function App() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [authToken, setAuthToken] = React.useState('');
  const [isSessionLoading, setIsSessionLoading] = React.useState(true);
  const [liveEventsClient] = React.useState(() => liveEventsService.getLiveEventsClient());

  React.useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await authService.getSession();
        if (cancelled) {
          return;
        }

        setCurrentUser(session?.user || null);
        setAuthToken(session?.token || '');
      } catch {
        if (cancelled) {
          return;
        }

        setCurrentUser(null);
        setAuthToken('');
      } finally {
        if (!cancelled) {
          setIsSessionLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isSessionLoading) {
    return (
      <main>
        <section>
          <p>Loading session...</p>
        </section>
      </main>
    );
  }

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
          {currentUser ? (
            <>
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
            </>
          ) : null}
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
          <Route
            path="/play"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Play currentUser={currentUser} liveEventsClient={liveEventsClient} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Practice currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scores"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Scores currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboards"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Leaderboards />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={
              <Login
                mode="login"
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                setAuthToken={setAuthToken}
                authToken={authToken}
              />
            }
          />
          <Route
            path="/register"
            element={
              <Login
                mode="register"
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                setAuthToken={setAuthToken}
                authToken={authToken}
              />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer>
          <p>Grant Gardner</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function ProtectedRoute({ currentUser, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
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
