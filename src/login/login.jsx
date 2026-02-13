import React from 'react';
import './login.css';

export function Login() {
  return (
    <main className="login-page">
      <h2>Login</h2>
      <section>
        <p>
          Logged in as: <span>Guest</span>
        </p>
      </section>

      <section>
        <h3>Login</h3>
        <form>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" />

          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" />

          <button type="submit">Sign in</button>
        </form>
      </section>

      <section>
        <h3>Register</h3>
        <form>
          <label htmlFor="register-username">Username</label>
          <input id="register-username" name="username" type="text" autoComplete="username" />

          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" autoComplete="email" />

          <label htmlFor="register-password">Password</label>
          <input id="register-password" name="password" type="password" autoComplete="new-password" />

          <label htmlFor="register-confirm">Confirm password</label>
          <input id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" />

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
