import React from 'react';
import './login.css';
import { authService } from '../services';

export function Login() {
  const [session, setSession] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    authService.getSession().then(setSession);
  }, []);

  async function handleLoginSubmit(event) {
    event.preventDefault();
    try {
      const nextSession = await authService.login(loginForm);
      setSession(nextSession);
      setMessage('Signed in');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const nextSession = await authService.register(registerForm);
      setSession(nextSession);
      setMessage('Account created');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleLogout() {
    await authService.logout();
    setSession(null);
    setMessage('Signed out');
  }

  return (
    <main className="login-page">
      <h2>Login</h2>
      <section>
        <p>
          Logged in as: <span>{session?.user?.username || 'Guest'}</span>
        </p>
        {session ? <button onClick={handleLogout}>Sign out</button> : null}
        {message ? <p>{message}</p> : null}
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

      <p>(Service placeholder) This will call /api/auth/login and /api/auth/register</p>
      <p>
        <a href="/">Back to Home</a>
      </p>
    </main>
  );
}
