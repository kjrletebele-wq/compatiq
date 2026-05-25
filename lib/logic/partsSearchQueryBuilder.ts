import type { DeviceIdentity, DeviceSpecs, DeviceCategory } from '@/lib/types/device';
import type { ComponentType } from '@/lib/types/upgradeability';

export interface PartsQuerySet {
  primaryQuery: string;
  alternativeQueries: string[];
  warnings: string[];
  deviceLabel: string;
}

/**
 * Build a clean device label without duplicating brand.
 * e.g. "HP 15s" not "HP HP Laptop"
 */
export function formatDeviceLabel(
  brand: string | null,
  model: string | null,
  deviceName: string | null
): string {
  const b = (brand ?? '').trim();
  const m = (model ?? '').trim();
  const dn = (deviceName ?? '').trim();

  // If model already starts with brand, just use model
  if (m && b && m.toLowerCase().startsWith(b.toLowerCase())) {
    return m;
  }

  // If deviceName starts with brand, use it directly (truncated)
  if (dn && b && dn.toLowerCase().startsWith(b.toLowerCase())) {
    // Take up to 6 words to avoid full spec dump in search
    return dn.split(/\s+/).slice(0, 6).join(' ');
  }

  // Build: "Brand Model"
  if (b && m) return `${b} ${m}`;
  if (b && dn) {
    const short = dn.split(/\s+/).slice(0, 5).join(' ');
    return short;
  }
  if (dn) return dn.split(/\s+/).slice(0, 5).join(' ');
  if (b) return b;
  return 'device';
}

/**
 * Generate search queries for a given component type and device.
 */
export function buildPartsQuerySet(
  componentType: ComponentType,
  device: DeviceIdentity,
  specs: DeviceSpecs | null,
  country?: string | null
): PartsQuerySet {
  const brand = device.brand ?? null;
  const model = device.model ?? null;
  const deviceName = device.deviceName ?? null;
  const category: DeviceCategory = device.category;

  const deviceLabel = formatDeviceLabel(brand, model, deviceName);
  const locationSuffix = country ? ` buy ${country}` : '';
  const warnings: string[] = [];

  // If no model is known, warn
  const hasExactModel = !!(model && model.length > 3);
  if (!hasExactModel) {
    warnings.push('Exact model number unknown — search results will be approximate. Verify compatibility before purchasing.');
  }

  const queries = buildComponentQueries(
    componentType, brand, model, deviceLabel, category, specs, locationSuffix, hasExactModel
  );

  return {
    primaryQuery: queries[0],
    alternativeQueries: queries.slice(1),
    warnings,
    deviceLabel,
  };
}

function buildComponentQueries(
  componentType: ComponentType,
  brand: string | null,
  model: string | null,
  deviceLabel: string,
  category: DeviceCategory,
  specs: DeviceSpecs | null,
  locationSuffix: string,
  hasExactModel: boolean
): string[] {
  const b = brand ?? '';

  switch (componentType) {
    case 'Battery': {
      const queries = [`${deviceLabel} battery replacement`];
      if (b) queries.push(`${b} laptop battery replacement`, `${b} ${model ?? 'laptop'} battery`);
      if (!hasExactModel) queries.push(`${b} laptop battery replacement generic compatible`);
      return addSuffix(queries, locationSuffix);
    }

    case 'Charger': {
      const watts = specs?.rawText?.match(/\b(45|65|90|135|150)W\b/i)?.[1];
      const hasUSBC = specs?.rawText && /usb[- ]?c/i.test(specs.rawText);
      const primary = `${deviceLabel} charger${watts ? ' ' + watts + 'W' : ''}${hasUSBC ? ' USB-C' : ''}`;
      const queries = [primary];
      if (b) queries.push(`${b} laptop charger${watts ? ' ' + watts + 'W' : ''}`, `${b} laptop power adapter`);
      queries.push(`${b} laptop USB-C barrel charger confirm model wattage`);
      return addSuffix(queries, locationSuffix);
    }

    case 'RAM': {
      const ramType = specs?.ramType ?? null;
      const ramGb = specs?.ramGb ?? null;
      const primary = `${deviceLabel} RAM upgrade${ramType ? ' ' + ramType : ''}`;
      const queries = [primary];
      if (b) {
        queries.push(
          `${b} laptop ${ramType ?? 'DDR4 DDR5'} RAM upgrade`,
          `${b} laptop ${ramGb ? ramGb * 2 + 'GB' : '16GB'} RAM upgrade`
        );
      }
      return addSuffix(queries, locationSuffix);
    }

    case 'SSD': {
      const storageType = specs?.storageType ?? null;
      const storageGb = specs?.storageGb ?? null;
      const primary = `${deviceLabel} SSD${storageType ? ' ' + storageType : ''} upgrade replacement`;
      const queries = [primary];
      if (b) {
        queries.push(
          `${b} laptop ${storageGb ? storageGb * 2 + 'GB' : '512GB'} SSD upgrade`,
          `${b} laptop NVMe SSD replacement`
        );
      }
      return addSuffix(queries, locationSuffix);
    }

    case 'HDD': {
      const queries = [`${deviceLabel} hard drive HDD replacement`];
      if (b) queries.push(`${b} laptop hard drive replacement 2.5 SATA`);
      return addSuffix(queries, locationSuffix);
    }

    case 'Screen': {
      const display = specs?.display ?? null;
      const size = display?.match(/(\d+(?:\.\d+)?)[- ]?inch/i)?.[1] ?? null;
      const hasFHD = display && /fhd|1080/i.test(display);
      const primary = `${deviceLabel} screen replacement${size ? ' ' + size + '"' : ''}${hasFHD ? ' FHD' : ''}`;
      const queries = [primary];
      if (b && size) queries.push(`${b} ${size} inch laptop screen panel replacement`);
      queries.push(`${b ?? ''} laptop display LCD replacement`.trim());
      return addSuffix(queries, locationSuffix);
    }

    case 'Keyboard': {
      const queries = [`${deviceLabel} keyboard replacement`];
      if (b) queries.push(`${b} laptop keyboard replacement`, `${b} ${model ?? ''} keyboard`.trim());
      return addSuffix(queries, locationSuffix);
    }

    case 'WifiCard': {
      const queries = [`${deviceLabel} wifi card replacement M.2`];
      if (b) queries.push(`${b} laptop wifi card module`, `${b} laptop wireless card replacement`);
      return addSuffix(queries, locationSuffix);
    }

    case 'CoolingFan': {
      const queries = [`${deviceLabel} cooling fan replacement`];
      if (b) queries.push(`${b} laptop cooling fan`, `${b} laptop fan replacement heatsink`);
      return addSuffix(queries, locationSuffix);
    }

    case 'Speakers': {
      const queries = [`${deviceLabel} speakers replacement`];
      if (b) queries.push(`${b} laptop speakers`);
      return addSuffix(queries, locationSuffix);
    }

    case 'ChargingPort': {
      const cat = category === 'Smartphone' ? 'phone' : 'laptop';
      const queries = [
        `${deviceLabel} charging port ${cat} replacement`,
        `${b ?? ''} ${cat} USB-C charging port flex`.trim(),
      ];
      return addSuffix(queries, locationSuffix);
    }

    case 'BackCover': {
      const cat = category === 'Smartphone' ? 'phone' : 'laptop';
      const queries = [
        `${deviceLabel} back cover housing ${cat}`,
        `${b ?? ''} ${model ?? ''} back cover replacement`.trim(),
      ];
      return addSuffix(queries, locationSuffix);
    }

    case 'CameraModule': {
      const cat = category === 'Smartphone' ? 'phone' : 'laptop';
      const queries = [
        `${deviceLabel} camera module ${cat} replacement`,
        `${b ?? ''} ${model ?? ''} camera replacement`.trim(),
      ];
      return addSuffix(queries, locationSuffix);
    }

    case 'GPU': {
      const queries = [`${deviceLabel} GPU graphics card upgrade`];
      if (b && category === 'PC') {
        queries.push(`${b} PC GPU upgrade graphics card`);
      }
      return addSuffix(queries, locationSuffix);
    }

    case 'PSU': {
      const queries = [`${deviceLabel} power supply PSU replacement`, `${b ?? ''} PC power supply ATX replacement`.trim()];
      return addSuffix(queries, locationSuffix);
    }

    case 'CPU': {
      const queries = [`${deviceLabel} CPU processor upgrade`];
      if (b) queries.push(`${b} laptop CPU upgrade compatible`);
      return addSuffix(queries, locationSuffix);
    }

    case 'CPUCooler': {
      const queries = [`${deviceLabel} CPU cooler replacement`];
      return addSuffix(queries, locationSuffix);
    }

    case 'CaseFans': {
      const queries = ['120mm 140mm PC case fan replacement', `${b ?? 'PC'} case fans`];
      return addSuffix(queries, locationSuffix);
    }

    case 'BluetoothCard': {
      const queries = [`${deviceLabel} bluetooth wifi card M.2`, `${b ?? ''} laptop bluetooth card module`.trim()];
      return addSuffix(queries, locationSuffix);
    }

    case 'Monitor': {
      const queries = ['monitor replacement', `${b ?? ''} monitor 24 inch FHD`.trim()];
      return addSuffix(queries, locationSuffix);
    }

    case 'Motherboard': {
      const queries = [`${deviceLabel} motherboard replacement`];
      return addSuffix(queries, locationSuffix);
    }

    case 'SIMTray': {
      const queries = [`${deviceLabel} SIM tray replacement`, `${b ?? ''} ${model ?? ''} SIM tray`.trim()];
      return addSuffix(queries, locationSuffix);
    }

    case 'Case': {
      const queries = [`${b ?? ''} ${model ?? ''} protective case cover`.trim(), `${deviceLabel} case`];
      return addSuffix(queries, locationSuffix);
    }

    case 'ScreenProtector': {
      const queries = [`${b ?? ''} ${model ?? ''} screen protector tempered glass`.trim(), `${deviceLabel} screen protector`];
      return addSuffix(queries, locationSuffix);
    }

    case 'Cable': {
      const queries = [`${b ?? ''} ${model ?? ''} cable USB-C data charging`.trim()];
      return addSuffix(queries, locationSuffix);
    }

    default: {
      return addSuffix([`${deviceLabel} ${componentType} replacement`], locationSuffix);
    }
  }
}

function addSuffix(queries: string[], suffix: string): string[] {
  return queries
    .map(q => (suffix ? q + suffix : q).replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Per-component warnings about compatibility risk.
 */
export function getComponentCompatibilityWarnings(
  componentType: ComponentType,
  hasExactModel: boolean
): string[] {
  const warnings: string[] = [];
  if (!hasExactModel) {
    warnings.push('Exact device model unknown. Compatibility cannot be guaranteed without the manufacturer model number.');
  }

  switch (componentType) {
    case 'RAM':
      warnings.push('RAM compatibility requires confirming DDR type, speed, and whether RAM is soldered. Check service manual or iFixit before ordering.');
      break;
    case 'SSD':
      warnings.push('SSD compatibility requires confirming M.2 slot type (PCIe/SATA) and physical size. Check service manual before ordering.');
      break;
    case 'Battery':
      warnings.push('Battery part numbers must match exactly. Using an incompatible battery can be a safety risk.');
      break;
    case 'Charger':
      warnings.push('Charger wattage, voltage, and connector type must match exactly. Using incorrect wattage can damage the device.');
      break;
    case 'Screen':
      warnings.push('Screen panels require exact part number or model match. Resolution, connector, and panel type must all match.');
      break;
    case 'CPU':
      warnings.push('CPU upgrades require socket compatibility and motherboard BIOS support. Verify before purchasing.');
      break;
    case 'GPU':
      warnings.push('GPU upgrades require PCIe slot availability, PSU wattage, and case clearance. Verify all three before purchasing.');
      break;
  }

  return warnings;
}
