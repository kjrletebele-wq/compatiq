/**
 * Masks a serial number for safe display.
 * Never expose full serial numbers in the UI or URLs.
 *
 * Examples:
 *   "5CG8465MFT"   → "5CG****MFT"
 *   "C02ABC123XYZ" → "C02****XYZ"
 *   "ABC123"       → "AB****23"
 */
export function maskSerial(serial: string): string {
  if (!serial || serial.length < 4) return '****';
  const trimmed = serial.trim();
  const len = trimmed.length;
  if (len <= 6) {
    const show = Math.max(1, Math.floor(len / 3));
    return trimmed.slice(0, show) + '****' + trimmed.slice(len - show);
  }
  const prefixLen = Math.min(3, Math.floor(len * 0.25));
  const suffixLen = Math.min(3, Math.floor(len * 0.25));
  const prefix = trimmed.slice(0, prefixLen);
  const suffix = trimmed.slice(len - suffixLen);
  return `${prefix}****${suffix}`;
}

/**
 * Redacts a sensitive value for logs/display.
 * Use when you need to indicate a value exists but must not show it.
 */
export function redactValue(value: string): string {
  if (!value) return '[empty]';
  return '[REDACTED]';
}
