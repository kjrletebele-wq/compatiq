import { createHash } from 'crypto';

/**
 * One-way hash of a serial number for server-side keying.
 * Use this as a lookup key — never store or pass the raw serial after intake.
 */
export function hashSerial(serial: string): string {
  return createHash('sha256')
    .update(serial.trim().toUpperCase())
    .digest('hex');
}
