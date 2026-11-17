import toast from 'react-hot-toast';

function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') return '';
  if (/E11000 duplicate key error/i.test(message)) {
    const match = message.match(/dup key:\s*\{\s*name:\s*"([^"]+)"/i);
    if (match) {
      return `"${match[1]}" already exists. Edit the existing item or use a different name.`;
    }
    return 'This record already exists.';
  }
  if (/^Cast to ObjectId failed/i.test(message)) {
    return 'Invalid record ID.';
  }
  return message;
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  // Check if it contains <pre> (standard Express 404/500 text)
  const preMatch = html.match(/<pre>([\s\S]*?)<\/pre>/i);
  if (preMatch && preMatch[1]) {
    return preMatch[1].replace(/<[^>]+>/g, '').trim();
  }
  // Check if it contains <title>
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    if (title && !/^error$/i.test(title)) return title;
  }
  // Strip all tags and collapse whitespace
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  const data = err.response?.data;
  const status = err.response?.status;

  if (data?.message && typeof data.message === 'string') {
    return sanitizeMessage(data.message);
  }

  if (typeof data === 'string' && data.trim()) {
    const trimmed = data.trim();
    // If the server returned an HTML error document (e.g. Express or Nginx/Render 404/502/503)
    if (trimmed.startsWith('<') || /<html/i.test(trimmed)) {
      const parsed = stripHtml(trimmed);
      if (parsed) {
        if (/cannot (post|get|put|delete)/i.test(parsed)) {
          return `Endpoint not found (${parsed}). Please check API URL configuration.`;
        }
        return sanitizeMessage(parsed);
      }
      if (status === 404) return 'The requested API endpoint was not found (404).';
      if (status >= 500) return 'Server error. Please try again in a moment.';
      return fallback;
    }
    return sanitizeMessage(trimmed);
  }

  if (status === 401) return 'Invalid credentials or session expired. Please check your email and password.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested record was not found.';
  if (status === 409) return 'This record already exists.';
  if (status === 413) return 'File is too large. Please use a smaller upload.';
  if (status === 422) return 'Please check your input and try again.';
  if (status >= 500) return 'Server error. Please try again in a moment.';

  if (err.code === 'ERR_NETWORK' || /network error/i.test(err.message || '')) {
    return 'Cannot reach the server. Check your connection or verify the backend is running.';
  }
  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  return fallback;
}

export function showApiError(err, fallback) {
  toast.error(getApiErrorMessage(err, fallback));
}
