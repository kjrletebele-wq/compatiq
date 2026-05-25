/**
 * Redacts sensitive patterns from a string before logging.
 * Use before writing any user-submitted text to console or logs.
 */
export function redactSensitive(value: string): string {
  if (!value) return value;
  // Replace anything that looks like a serial number (6–20 alphanumeric chars)
  return value.replace(/\b[A-Z0-9]{6,20}\b/gi, '[REDACTED]');
}
