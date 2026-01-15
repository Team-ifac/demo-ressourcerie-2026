const OAUTH_BASE_URL =
  import.meta.env.VITE_OAUTH_SERVER_URL && import.meta.env.VITE_OAUTH_SERVER_URL.startsWith('http')
    ? import.meta.env.VITE_OAUTH_SERVER_URL
    : 'http://localhost:3000';

export function getLoginUrl() {
  return `${OAUTH_BASE_URL}/auth/login`;
}

export function getLogoutUrl() {
  return `${OAUTH_BASE_URL}/auth/logout`;
}
