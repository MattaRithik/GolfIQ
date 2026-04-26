// LOCAL MVP AUTH ONLY — DO NOT USE IN PRODUCTION.
// Replace with a secure server-side auth system (NextAuth, Clerk, custom JWT, etc.)
// before any real deployment. Passwords are stored in plaintext below for local
// development only. Sessions live in localStorage and can be tampered with.

export type Role = 'customer' | 'admin';

export interface User {
  golfiq_id: string;
  role: Role;
  display_name: string;
}

interface Credential {
  golfiq_id: string;
  password: string;
  role: Role;
  display_name: string;
}

// MVP seeded users — REPLACE in production
const SEED_USERS: Credential[] = [
  { golfiq_id: 'admin', password: 'admin123', role: 'admin', display_name: 'Admin User' },
  { golfiq_id: 'demo', password: 'demo123', role: 'customer', display_name: 'Demo Golfer' },
];

const SESSION_KEY = 'golfiq_session_v1';

export function login(golfiqId: string, password: string): User | null {
  const match = SEED_USERS.find(
    u => u.golfiq_id.toLowerCase() === golfiqId.trim().toLowerCase() && u.password === password
  );
  if (!match) return null;
  const user: User = {
    golfiq_id: match.golfiq_id,
    role: match.role,
    display_name: match.display_name,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return user;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
