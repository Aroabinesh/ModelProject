// Live client for the Auth endpoints (see {BASE_URL}/swagger/index.html, "Auth" tag).

import { request } from './httpClient';

export async function login(username, password) {
  const dto = await request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  return {
    token: dto.token,
    expiresAt: dto.expiresAt,
    userId: dto.userId,
    username: dto.username,
  };
}

// Named distinctly from httpClient's getCurrentUser (which just reads the cached
// username from localStorage) since this one calls the API.
export async function fetchCurrentUser() {
  return request('/api/auth/me');
}
