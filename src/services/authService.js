const USERS_KEY = 'ink_mock_users';
const SESSION_KEY = 'ink_mock_session';

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function buildSession(user) {
  return {
    token: `mock-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    createdAt: new Date().toISOString(),
  };
}

export async function register({ username, email, password }) {
  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    throw new Error('Email already registered');
  }

  const user = {
    id: `u_${Date.now()}`,
    username,
    email,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);

  const session = buildSession(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function login({ email, password }) {
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const session = buildSession(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  return { ok: true };
}

export async function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}
