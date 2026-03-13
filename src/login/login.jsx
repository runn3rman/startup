import React from 'react';
import { authService } from '../services';
import './login.css';

export function Login({ currentUser, setCurrentUser, setAuthToken, authToken }) {
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
      <h2>Login</h2>
      <section>
        <p>
          Logged in as: <span>{currentUser?.username || 'Guest'}</span>
        </p>
        {currentUser ? (
          <button onClick={handleLogout} disabled={isSubmitting}>
            {isSubmitting ? 'Signing out...' : 'Sign out'}
          </button>
        ) : null}
        {error ? <p>{error}</p> : null}
        {success ? <p>{success}</p> : null}
      </section>

      <section>
        <h3>Login</h3>
        <form onSubmit={handleLoginSubmit}>
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
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>

      <section>
        <h3>Register</h3>
        <form onSubmit={handleRegisterSubmit}>
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
            {isSubmitting ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </section>

      <p>Authentication uses backend sessions and auth cookies.</p>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
