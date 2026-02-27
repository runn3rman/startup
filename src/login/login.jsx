import React from 'react';
import './login.css';

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const AUTH_TOKEN_KEY = 'authToken';

export function Login({ currentUser, setCurrentUser, setAuthToken, authToken }) {
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function persistSession(user) {
    const token = `token-${Date.now()}`;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setCurrentUser(user);
    setAuthToken(token);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!loginForm.email || !loginForm.password) {
      setError('Email and password are required');
      return;
    }

    const users = getUsers();
    const user = users.find((item) => item.email.toLowerCase() === loginForm.email.toLowerCase());

    if (!user || user.password !== loginForm.password) {
      setError('Invalid email or password');
      return;
    }

    persistSession({ username: user.username, email: user.email });
    setSuccess('Signed in');
  }

  function handleRegisterSubmit(event) {
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

    const users = getUsers();
    const existing = users.find((item) => item.email.toLowerCase() === registerForm.email.toLowerCase());
    if (existing) {
      setError('Email already exists');
      return;
    }

    const newUser = {
      username: registerForm.username.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
    };

    users.push(newUser);
    saveUsers(users);
    persistSession({ username: newUser.username, email: newUser.email });
    setSuccess('Account created');
  }

  function handleLogout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentUser(null);
    setAuthToken('');
    setError('');
    setSuccess('Signed out');
  }

  return (
    <main className="login-page">
      <h2>Login</h2>
      <section>
        <p>
          Logged in as: <span>{currentUser?.username || 'Guest'}</span>
        </p>
        <p>Token: {authToken || 'none'}</p>
        {currentUser ? <button onClick={handleLogout}>Sign out</button> : null}
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

          <button type="submit">Sign in</button>
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

          <button type="submit">Create account</button>
        </form>
      </section>

      <p>Stored in localStorage keys: users, currentUser, authToken</p>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
