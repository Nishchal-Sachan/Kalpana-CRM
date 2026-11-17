const rawUrl = import.meta.env.VITE_API_URL;

if (!rawUrl) {
  throw new Error(
    'VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env and set your API URL.',
  );
}

const cleaned = rawUrl.replace(/\/+$/, '');
// Ensure /api suffix so routes like '/auth/login' properly reach '/api/auth/login'
// even if VITE_API_URL is configured without trailing '/api' in deployment.
export const API_BASE_URL = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;

