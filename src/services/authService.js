import { apiGet, apiPost } from './apiClient';

function buildSession(user) {
  return {
    token: 'cookie-session',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    createdAt: new Date().toISOString(),
  };
}

export async function register({ username, email, password }) {
  const body = await apiPost('/api/auth/register', { username, email, password }, 'Registration failed');
  return buildSession(body.user);
}

export async function login({ email, password }) {
  const body = await apiPost('/api/auth/login', { email, password }, 'Login failed');
  return buildSession(body.user);
}

export async function logout() {
  return apiPost('/api/auth/logout', {}, 'Logout failed');
}

export async function getSession() {
  try {
    const body = await apiGet('/api/auth/me', 'Failed to load session');
    return buildSession(body.user);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return null;
    }
    throw error;
  }
}
