import type { DeviceSpecs } from '@/lib/types/device';

/**
 * Detects conflicts and anomalies in extracted device data.
 * Returns human-readable warning strings.
 */
export function detectConflicts(specs: DeviceSpecs | null, rawText: string): string[] {
  if (!specs) return [];
  const warnings: string[] = [];
  const text = rawText.toLowerCase();

  // Intel vs AMD conflict (CPU field vs raw text)
  if (specs.cpu) {
    const cpuLower = specs.cpu.toLowerCase();
    const cpuIsAMD = /amd|ryzen/.test(cpuLower);
    const cpuIsIntel = /intel|core i[0-9]/.test(cpuLower);
    const textHasAMD = /\bamd\b|\bryzen\b/.test(text);
    const textHasIntel = /\bintel\b|\bcore i[0-9]\b/.test(text);

    if (cpuIsAMD && textHasIntel && !textHasAMD) {
      warnings.push(
        'Source conflict: CPU field indicates AMD/Ryzen but product description also mentions Intel. ' +
        'Extracted specification used as higher-confidence source. Verify with the seller.'
      );
    }
    if (cpuIsIntel && textHasAMD && !textHasIntel) {
      warnings.push(
        'Source conflict: CPU field indicates Intel but product description also mentions AMD/Ryzen. ' +
        'Extracted specification used as higher-confidence source. Verify with the seller.'
      );
    }
  }

  // RAM mismatch between parsed field and raw text mentions
  if (specs.ramGb) {
    const ramMentions = [...rawText.matchAll(/\b(\d+)\s*GB\s+(?:RAM|DDR\w*|LPDDR\w*)/gi)].map(m => parseInt(m[1]));
    const uniqueRAMs = [...new Set(ramMentions)].filter(v => v > 0);
    if (uniqueRAMs.length > 1 && !uniqueRAMs.includes(specs.ramGb)) {
      warnings.push(
        `RAM conflict: multiple RAM amounts found in product text (${uniqueRAMs.join('GB, ')}GB). ` +
        `Using ${specs.ramGb}GB as extracted value. Confirm with the seller.`
      );
    }
  }

  // Storage mismatch
  if (specs.storageGb) {
    const stMentions = [...rawText.matchAll(/\b(\d+)\s*(GB|TB)\s+(?:SSD|HDD|NVMe|eMMC)/gi)].map(m => {
      const v = parseInt(m[1]);
      return m[2].toUpperCase() === 'TB' ? v * 1024 : v;
    });
    const uniqueST = [...new Set(stMentions)].filter(v => v > 0);
    if (uniqueST.length > 1 && !uniqueST.includes(specs.storageGb)) {
      warnings.push(
        `Storage conflict: multiple storage sizes found in product text. Using ${specs.storageGb}GB as extracted value. Confirm with the seller.`
      );
    }
  }

  // Suspicious laptop battery in mAh (should be Wh)
  const mahMatch = rawText.match(/\b(\d{4,6})\s*mAh\b/i);
  if (mahMatch) {
    const mah = parseInt(mahMatch[1]);
    // Laptop batteries: >15000 mAh is suspicious (most are 40-100Wh ≈ 3600-9000mAh at 11.1V)
    if (mah > 15000) {
      warnings.push(
        `Suspicious battery value: ${mahMatch[0]} — Laptop batteries are typically rated in Wh (watt-hours), not mAh. ` +
        `This value appears unusually high and may be from a different source or unit error.`
      );
    }
  }

  return warnings;
}
