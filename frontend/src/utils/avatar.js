const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function resolveAvatar(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${API}/auth/avatar/${avatar}`;
}
