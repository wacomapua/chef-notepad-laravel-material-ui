export function getCsrfTokenFromCookie(): string | null {
  const name = 'XSRF-TOKEN=';
  const decoded = decodeURIComponent(document.cookie || '');
  const parts = decoded.split(';');
  for (let c of parts) {
    c = c.trim();
    if (c.startsWith(name)) {
      // Laravel sets XSRF-TOKEN cookie value URL-encoded and base64-like; decodeURIComponent already applied
      return c.substring(name.length);
    }
  }
  return null;
}

