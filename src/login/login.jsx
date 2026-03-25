import React from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services';
import './login.css';

export function Login({ mode = 'login', currentUser, setCurrentUser, setAuthToken, authToken }) {
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function persistSession(user) {
    setCurrentUser(user);
    setAuthToken('cookie-session');
  }

  const isRegisterMode = mode === 'register';
  const pageTitle = isRegisterMode ? 'Create account' : 'Sign in';
  const submitLabel = isRegisterMode ? 'Create account' : 'Sign in';
  const submitPendingLabel = isRegisterMode ? 'Creating account...' : 'Signing in...';

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!loginForm.email || !loginForm.password) {
      setError('Email and password are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const session = await authService.login(loginForm);
      persistSession(session.user);
      setSuccess('Signed in');
    } catch (submitError) {
      setError(submitError.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      setError('All register fields are required');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const session = await authService.register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      });
      persistSession(session.user);
      setSuccess('Account created');
    } catch (submitError) {
      setError(submitError.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      setIsSubmitting(true);
      await authService.logout();
      setCurrentUser(null);
      setAuthToken('');
      setError('');
      setSuccess('Signed out');
    } catch (submitError) {
      setError(submitError.message || 'Failed to sign out');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-eyebrow">InkSpace account</p>
        <h2>{currentUser ? 'Account' : pageTitle}</h2>
        <p className="login-subtitle">
          {currentUser
            ? 'You are signed in and can manage your current session here.'
            : 'Authentication uses backend sessions and auth cookies.'}
        </p>

        {error ? <p className="login-message login-message-error">{error}</p> : null}
        {success ? <p className="login-message login-message-success">{success}</p> : null}

        {currentUser ? (
          <div className="login-account-panel">
            <p>
              Logged in as <strong>{currentUser.username}</strong>
            </p>
            <p>{currentUser.email}</p>
            <button type="button" onClick={handleLogout} disabled={isSubmitting}>
              {isSubmitting ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        ) : isRegisterMode ? (
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              name="username"
              type="text"
              autoComplete="username"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
            />

            <label htmlFor="register-confirm">Confirm password</label>
            <input
              id="register-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={registerForm.confirmPassword}
              onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
            />

            <button type="submit" disabled={isSubmitting || Boolean(authToken)}>
              {isSubmitting ? submitPendingLabel : submitLabel}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />

            <button type="submit" disabled={isSubmitting || Boolean(authToken)}>
              {isSubmitting ? submitPendingLabel : submitLabel}
            </button>
          </form>
        )}

        {!currentUser ? (
          <p className="login-helper-link">
            {isRegisterMode ? (
              <>
                Already registered? <Link to="/login">Sign in here</Link>
              </>
            ) : (
              <>
                Haven&apos;t registered? <Link to="/register">Register here</Link>
              </>
            )}
          </p>
        ) : null}

        <p className="login-home-link">
          <Link to="/">Back to Home</Link>
        </p>
      </section>
    </main>
  );
}
