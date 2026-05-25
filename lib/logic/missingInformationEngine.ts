import type { DeviceSpecs, DeviceCategory } from '@/lib/types/device';

export function getMissingInformation(
  category: DeviceCategory,
  specs: DeviceSpecs | null
): string[] {
  if (!specs) {
    return ['CPU / chipset', 'RAM', 'Storage type', 'Display', 'GPU', 'Battery', 'Operating system'];
  }

  const missing: string[] = [];

  if (!specs.cpu && !specs.chipset) missing.push('CPU / chipset');
  if (!specs.ramGb && !specs.ram) missing.push('RAM amount');
  if (!specs.storageType) missing.push('Storage type (SSD/HDD/NVMe)');
  if (!specs.display) missing.push('Display specification');

  if (category !== 'Smartphone') {
    if (!specs.gpu) missing.push('GPU / graphics');
    if (!specs.battery) missing.push('Battery capacity');
  }

  if (category === 'Smartphone') {
    if (!specs.camera) missing.push('Camera specification');
    if (!specs.charging) missing.push('Charging speed / wattage');
  }

  if (!specs.operatingSystem) missing.push('Operating system');
  if (!specs.connectivity) missing.push('Connectivity (Wi-Fi/Bluetooth standard)');

  return missing;
}
