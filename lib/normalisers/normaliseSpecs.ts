import type { DeviceSpecs } from '@/lib/types/device';

/**
 * Infers integrated GPU name from CPU model string.
 * AMD Ryzen 5xxx/6xxx/7xxx/8xxx APUs always have integrated Radeon graphics.
 * Intel Tiger Lake (11th gen+) has Iris Xe.
 * Apple A-series (A15 Bionic etc.) → Apple GPU.
 */
export function inferGPUFromCPU(cpu: string): string | null {
  if (!cpu) return null;
  const c = cpu.toLowerCase();
  if (/ryzen [3579] [5-9]\d{3}/.test(c)) return 'AMD Radeon Graphics';
  if (/ryzen [3579] [4]\d{3}[gu]/.test(c)) return 'AMD Radeon Vega';
  if (/core ultra [579]/i.test(c)) return 'Intel Arc Graphics';
  if (/core i[5-9]-1[1-9]\d{3}[gu]/i.test(c)) return 'Intel Iris Xe Graphics';
  if (/apple m[0-9]/i.test(c)) return 'Apple Silicon GPU';
  if (/a\d{2}\s+bionic|a\d{2}\s+chip|a\d{2}\s+pro/i.test(c)) return 'Apple GPU';
  if (/snapdragon/i.test(c)) return 'Qualcomm Adreno GPU';
  if (/dimensity|mediatek|helio/i.test(c)) return 'ARM Mali/Immortalis GPU';
  if (/exynos/i.test(c)) return 'ARM Mali GPU';
  return null;
}

/**
 * Merge two DeviceSpecs objects. Override wins for non-null/undefined values.
 */
export function mergeSpecs(base: DeviceSpecs, override: Partial<DeviceSpecs>): DeviceSpecs {
  const result: DeviceSpecs = { ...base };
  for (const key of Object.keys(override) as (keyof DeviceSpecs)[]) {
    const val = override[key];
    if (val !== null && val !== undefined && val !== '') {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

/**
 * Extract specs from structured key/value spec table rows.
 */
export function normaliseSpecsFromSpecRows(rows: { key: string; value: string }[]): Partial<DeviceSpecs> {
  const specs: Partial<DeviceSpecs> = {};

  // IC composite CPU: collect "Processor" + "Processor Model Number" separately, then combine
  let processorFamily: string | null = null;
  let processorModelNumber: string | null = null;

  for (const { key, value } of rows) {
    const k = key.toLowerCase().replace(/[\s/\-_().]/g, '');
    const v = value.trim();
    if (!v || v.length < 1) continue;

    // Skip non-spec Amazon rows early
    if (/^(color|colour|specificusesforproduct|countryoforigin|manufacturer|brand|modelyear|bestsellersrank|upc|opticalstoragedevice|graphicsramtype|processorcount|processorspeed|processorspeedunit|rammemorymaximumsize|itemdimensions|returningpolicydetails|warrantytype)/.test(k)) {
      // Warranty description is useful
      if (k === 'warrantydescription' && v) {
        specs.warranty = v.slice(0, 80);
      }
      continue;
    }

    if (/^(processor|cpu|processormodel|processortype|chipset|processorseries)$/.test(k)) {
      // Amazon includes full model in "Processor Series: Amd Ryzen 3 7320U" — normalise casing
      let normalised = v
        .replace(/\bamd\b/gi, 'AMD')
        .replace(/\bryzen\b/gi, 'Ryzen')
        .replace(/\bintel\b/gi, 'Intel')
        .replace(/\bcore\b/gi, 'Core')
        .replace(/\bapple\b/gi, 'Apple')
        .replace(/\bmediatek\b/gi, 'MediaTek')
        .replace(/\bdimensity\b/gi, 'Dimensity')
        .replace(/\bsnapdragon\b/gi, 'Snapdragon')
        .replace(/\bqualcomm\b/gi, 'Qualcomm')
        .replace(/\bexynos\b/gi, 'Exynos')
        .replace(/\bhelio\b/gi, 'Helio')
        // Uppercase CPU model-number suffixes: "7520u" → "7520U", "7730u" → "7730U"
        .replace(/\b(\d{4,}[a-z]{1,3})\b/g, s => s.toUpperCase());
      // Add vendor prefix when the value starts with a bare CPU family name
      if (/^Ryzen\s+[3579]/i.test(normalised) && !/^AMD/i.test(normalised)) {
        normalised = 'AMD ' + normalised;
      } else if (/^Core\s+[Ui]/i.test(normalised) && !/^Intel/i.test(normalised)) {
        normalised = 'Intel ' + normalised;
      }
      processorFamily = normalised.slice(0, 120);
      if (!specs.cpu) {
        specs.cpu = processorFamily;
        if (!specs.gpu) specs.gpu = inferGPUFromCPU(normalised) ?? undefined;
      }
    } else if (/^(processormodelnumber|cpumodelnumber)$/.test(k)) {
      // IC: "7520U"; Amazon also has processorspeed ("4.1 GHz") — skip speed-only values for CPU model
      if (/^[A-Z0-9]{3,8}$/i.test(v) && !/ghz|mhz/i.test(v)) {
        processorModelNumber = v.slice(0, 20);
      }
    } else if (/^(graphics|gpu|graphiccard|graphicscard|graphicsprocessor|videocard|integratedgraphics|graphicsprocessormodel|videoprocesor|videoprocessor|graphicsdescription)$/.test(k)) {
      // Amazon "Video Processor: AMD" — skip single-word brand-only values; infer from CPU instead
      const isBrandOnly = /^(amd|intel|nvidia|qualcomm|apple)$/i.test(v.trim());
      if (!isBrandOnly && !/^(integrated|dedicated)$/i.test(v)) {
        specs.gpu = v.slice(0, 80);
      } else if (isBrandOnly && !specs.gpu && specs.cpu) {
        specs.gpu = inferGPUFromCPU(specs.cpu) ?? undefined;
      }
    } else if (/^(ram|installedmemory|ramsize|ramcapacity|rammemoryinstalled|rammemoryinstalledsize)$/.test(k)) {
      // Explicitly RAM-labeled keys — always treat as RAM
      const gbM = v.match(/(\d+)\s*GB/i);
      if (gbM) specs.ramGb = parseInt(gbM[1]);
      const typeM = v.match(/\b(LPDDR5X?|LPDDR4X?|DDR5|DDR4|DDR3)\b/i);
      if (typeM) specs.ramType = typeM[1].toUpperCase();
      const speedM = v.match(/(\d{4,5})\s*MHz/i);
      specs.ram = specs.ramGb
        ? `${specs.ramGb}GB${specs.ramType ? ' ' + specs.ramType : ''}${speedM ? ' ' + speedM[1] + 'MHz' : ''}`
        : v;
    } else if (/^(memory|systemmemory)$/.test(k)) {
      // "Memory" alone is ambiguous: laptops use it for RAM, phones use it for storage.
      // Use value size to disambiguate: ≤ 32GB → RAM, > 32GB → storage (phone internal memory).
      const gbM = v.match(/(\d+)\s*GB/i);
      if (gbM) {
        const gb = parseInt(gbM[1]);
        if (gb <= 32) {
          specs.ramGb = gb;
          const typeM = v.match(/\b(LPDDR5X?|LPDDR4X?|DDR5|DDR4|DDR3)\b/i);
          if (typeM) specs.ramType = typeM[1].toUpperCase();
          specs.ram = `${gb}GB${specs.ramType ? ' ' + specs.ramType : ''}`;
        } else if (!specs.storageGb) {
          specs.storageGb = gb;
          specs.storage = v;
        }
      }
    } else if (/^(ramtype|memorytype|rammemoryinstalled|rammemorytechnology)$/.test(k)) {
      if (!specs.ramType) {
        const typeM = v.match(/\b(LPDDR5X?|LPDDR4X?|DDR5|DDR4|DDR3)\b/i);
        specs.ramType = typeM ? typeM[1].toUpperCase() : v.slice(0, 10);
        // Rebuild RAM string if we now have the type
        if (specs.ramGb) {
          specs.ram = `${specs.ramGb}GB${specs.ramType ? ' ' + specs.ramType : ''}${specs.ramSpeed ? ' ' + specs.ramSpeed : ''}`;
        }
      }
    } else if (/^(ramspeed|ramfrequency|memoryspeed|memoryfrequency|ramclock)$/.test(k)) {
      const speedM = v.match(/(\d{3,5})\s*(?:MHz)?/i);
      if (speedM) {
        specs.ramSpeed = `${speedM[1]}MHz`;
        // Rebuild RAM string to include speed
        if (specs.ramGb) {
          specs.ram = `${specs.ramGb}GB${specs.ramType ? ' ' + specs.ramType : ''} ${specs.ramSpeed}`;
        }
      }
    } else if (/^(storage|harddrive|ssd|hdd|internalstorage|harddisk|storagecapacity|ssdcapacity|harddrivesize|memorystoragecapacity|flashmemorysize|internalmemory)$/.test(k)) {
      const stM = v.match(/(\d+)\s*(GB|TB)/i);
      if (stM) {
        specs.storageGb = stM[2].toUpperCase() === 'TB' ? parseInt(stM[1]) * 1024 : parseInt(stM[1]);
        if (/nvme/i.test(v)) specs.storageType = 'NVMe';
        else if (/emmc/i.test(v)) specs.storageType = 'eMMC';
        else if (/ssd/i.test(v)) specs.storageType = 'SSD';
        else if (/hdd|hard\s*disk|hard\s*drive/i.test(v)) specs.storageType = 'HDD';
        specs.storage = v;
      } else {
        // Value doesn't contain GB/TB — could be a weight or irrelevant value, skip storage assignment
        if (/nvme/i.test(v)) specs.storageType = specs.storageType ?? 'NVMe';
        else if (/emmc/i.test(v)) specs.storageType = specs.storageType ?? 'eMMC';
        else if (/ssd/i.test(v)) specs.storageType = specs.storageType ?? 'SSD';
        else if (/hdd|hard\s*disk|hard\s*drive/i.test(v)) specs.storageType = specs.storageType ?? 'HDD';
      }
    } else if (/^(harddiskdescription|harddisktype)$/.test(k)) {
      // Amazon: "Hard Disk Description: SSD"
      if (!specs.storageType) {
        if (/nvme/i.test(v)) specs.storageType = 'NVMe';
        else if (/emmc/i.test(v)) specs.storageType = 'eMMC';
        else if (/ssd/i.test(v)) specs.storageType = 'SSD';
        else if (/hdd|hard/i.test(v)) specs.storageType = 'HDD';
      }
    } else if (/^(display|screen|screendisplay|screensize|displaysize)$/.test(k)) {
      // If display already has panel info (e.g. "LED"), prepend the size
      if (specs.display && !specs.display.includes(v)) {
        specs.display = `${v} · ${specs.display}`;
      } else {
        specs.display = v.slice(0, 100);
      }
    } else if (/^(resolution|screenresolution|displayresolution|nativeresolution)$/.test(k)) {
      // Normalize Amazon "720p" → "720p HD"
      const resVal = /^\d{3,4}p$/i.test(v.trim()) ? v.trim() : v;
      if (specs.display && !specs.display.toLowerCase().includes(resVal.toLowerCase())) {
        specs.display = `${specs.display} · ${resVal}`;
      } else if (!specs.display) {
        specs.display = resVal;
      }
    } else if (/^(brightness|screenbright|displaytype)$/.test(k)) {
      // Amazon "Display Type: LED" — append to display if not already there
      if (specs.display && !specs.display.toLowerCase().includes(v.toLowerCase())) {
        specs.display = `${specs.display} · ${v}`;
      }
    } else if (/^(storagetechnology|storagetype)$/.test(k)) {
      if (!specs.storageType) {
        if (/nvme/i.test(v)) specs.storageType = 'NVMe';
        else if (/emmc/i.test(v)) specs.storageType = 'eMMC';
        else if (/ssd/i.test(v)) specs.storageType = 'SSD';
        else if (/hdd|hard\s*disk/i.test(v)) specs.storageType = 'HDD';
        else specs.storageType = v.slice(0, 20);
      }
    } else if (/^(operatingsystem|os|software|preinstalledos)$/.test(k)) {
      const osM = v.match(/(Windows\s*\d+[^\n,]{0,30}|macOS\s*\w+|iOS\s*\d*[^\n,]{0,20}|Android\s*\d+[^\n,]{0,20}|Ubuntu\s*[\d.]+)/i);
      specs.operatingSystem = osM ? osM[1].trim() : v.slice(0, 60);
    } else if (/^(battery|batterylife|batterysize|batterycapacity)$/.test(k)) {
      const mahM = v.match(/^(\d+)\s*mAh$/i);
      if (mahM && parseInt(mahM[1]) < 1000) {
        // Flag as suspicious rather than silently skip — source lists a very low mAh value
        specs.battery = `${v} — source value, verify (laptops typically rated in Wh, not mAh)`;
      } else {
        specs.battery = v.slice(0, 80);
      }
    } else if (/^(weight|productweight|netweight|itemweight)$/.test(k)) {
      specs.weight = v.slice(0, 40);
    } else if (/^(warranty|warrantyperiod|guarantee)$/.test(k)) {
      specs.warranty = v.slice(0, 80);
    } else if (/^(usbtypec|usbc|typec|usbtypecports)$/.test(k)) {
      const existing = specs.ports ?? '';
      const count = v.match(/^(\d+)$/)?.[1] ?? v;
      const portStr = /^\d+$/.test(count) ? `USB-C x${count}` : `USB-C`;
      specs.ports = existing ? `${existing}, ${portStr}` : portStr;
    } else if (/^(usb3|usb30|usb31|usb32|usbports|usb3xports)$/.test(k)) {
      const existing = specs.ports ?? '';
      const count = v.match(/^(\d+)$/)?.[1] ?? v;
      const portStr = /^\d+$/.test(count) ? `USB 3.x x${count}` : `USB 3.x`;
      specs.ports = existing ? `${existing}, ${portStr}` : portStr;
    } else if (/^(hdmi|hdmiout|hdmioutput)$/.test(k)) {
      const existing = specs.ports ?? '';
      if (/yes|1|true/i.test(v)) {
        specs.ports = existing ? `${existing}, HDMI` : 'HDMI';
      }
    } else if (/^(displaytechnology|paneltype)$/.test(k)) {
      if (specs.display && !specs.display.toLowerCase().includes(v.toLowerCase())) {
        specs.display = `${specs.display} · ${v}`;
      } else if (!specs.display) {
        specs.display = v;
      }
    } else if (/^(wifi|wiFi|wireless|wlan|networkwifi|builtinwifi)$/.test(k)) {
      const existing = specs.connectivity ?? '';
      const wifiVal = /yes|true/i.test(v) ? 'Wi-Fi' : `Wi-Fi ${v}`;
      specs.connectivity = existing ? `${existing}, ${wifiVal}` : wifiVal;
    } else if (/^(bluetooth|bt)$/.test(k)) {
      const existing = specs.connectivity ?? '';
      const btVal = /yes|true/i.test(v) ? 'Bluetooth' : `Bluetooth ${v}`;
      specs.connectivity = existing ? `${existing}, ${btVal}` : btVal;
    } else if (/^(connectivitytechnology|networktype|wirelesstechnology)$/.test(k)) {
      // Amazon: "Connectivity Technology: 5G, Wi-Fi 6, Bluetooth 5.3, NFC, Ultra Wideband"
      // Take the value as-is (already a comma-separated list)
      if (!specs.connectivity) {
        specs.connectivity = v.slice(0, 120);
      }
    } else if (/^(cellulartechnology|networktype|networkstandard)$/.test(k)) {
      // Amazon: "Cellular Technology: 5G" — add to connectivity if not already there
      const existing = specs.connectivity ?? '';
      if (!existing.toLowerCase().includes(v.toLowerCase())) {
        specs.connectivity = existing ? `${v}, ${existing}` : v.slice(0, 40);
      }
    } else if (/^(modelname)$/.test(k)) {
      // Amazon "Model Name: HP Laptop 15-fc0083ni" — not a spec field, skip
    } else if (/^(camera|webcam|frontcamera|frontcam|webcamcapability|builtinmedia|cameraresolution|camerares|webcamresolution|webcamcap)$/.test(k)) {
      if (/yes|true/i.test(v)) {
        specs.camera = specs.camera ?? 'Webcam';
      } else if (!/no|false/i.test(v)) {
        // Prefer a more descriptive value over a less descriptive one
        if (!specs.camera || v.length > specs.camera.length) {
          specs.camera = v.slice(0, 60);
        }
      }
    } else if (/^(displaybrightness|brightness|screenbright|screenbrightness|panelbright)$/.test(k)) {
      specs.brightness = v.slice(0, 40);
    } else if (/^(colour|color)$/.test(k)) {
      // skip — not a tech spec
    }
  }

  // IC composite CPU: combine "AMD Ryzen 5" + "7520U" → "AMD Ryzen 5 7520U"
  if (processorFamily && processorModelNumber) {
    // Only compose if the model number is not already in the family string
    if (!processorFamily.toLowerCase().includes(processorModelNumber.toLowerCase())) {
      specs.cpu = `${processorFamily} ${processorModelNumber}`;
    } else {
      specs.cpu = processorFamily;
    }
    if (!specs.gpu) specs.gpu = inferGPUFromCPU(specs.cpu) ?? undefined;
  }

  // Infer GPU from CPU if still missing
  if (!specs.gpu && specs.cpu) {
    specs.gpu = inferGPUFromCPU(specs.cpu) ?? undefined;
  }

  return specs;
}

/**
 * Extract specs from a product title.
 * Handles: "HP 15s AMD Ryzen™ 5 7520U 16GB RAM 512GB SSD Laptop Midnight Blue"
 */
export function normaliseSpecsFromTitle(title: string): Partial<DeviceSpecs> {
  if (!title) return {};
  const specs: Partial<DeviceSpecs> = {};

  // Strip trademark/registered/copyright symbols that appear in product names
  // e.g. "Ryzen™" → "Ryzen", "Core®" → "Core"
  const cleanTitle = title.replace(/[™®©\u2122\u00ae\u00a9]/g, '').replace(/\s{2,}/g, ' ');

  // RAM: "16GB RAM", "16GB DDR5", "8GB LPDDR5"
  const ramM = cleanTitle.match(/\b(\d+)\s*GB\s+(?:RAM|LPDDR\w*|DDR\w*)/i) ??
    cleanTitle.match(/\b(\d+)GB\s+RAM\b/i);
  if (ramM) {
    specs.ramGb = parseInt(ramM[1]);
    const rtM = cleanTitle.match(/\b(LPDDR5X?|LPDDR4X?|DDR5|DDR4|DDR3)\b/i);
    specs.ramType = rtM ? rtM[1].toUpperCase() : undefined;
    specs.ram = `${specs.ramGb}GB${specs.ramType ? ' ' + specs.ramType : ''}`;
  }

  // Storage: "512GB SSD", "1TB HDD", "256GB NVMe"
  const stM = cleanTitle.match(/\b(\d+)\s*(GB|TB)\s+(SSD|HDD|NVMe|eMMC)\b/i);
  if (stM) {
    const val = parseInt(stM[1]);
    const unit = stM[2].toUpperCase();
    specs.storageGb = unit === 'TB' ? val * 1024 : val;
    const rawType = stM[3].toUpperCase();
    specs.storageType = rawType === 'NVME' ? 'NVMe' : rawType === 'EMMC' ? 'eMMC' : rawType;
    specs.storage = `${stM[1]}${stM[2]} ${specs.storageType}`;
  }

  // CPU — tight named patterns (match against cleanTitle to handle ™ symbols)
  const cpuPatterns: RegExp[] = [
    // Full brand prefix — most specific
    /\b(AMD\s+Ryzen\s+(?:PRO\s+)?[3579]\s+(?:PRO\s+)?\d{4}[A-Z]{0,3})\b/i,
    /\b(Intel\s+Core\s+Ultra\s+[579]\s+\d{3}[A-Z]{0,2})\b/i,
    /\b(Intel\s+Core\s+[Ui][0-9]-\d{4,5}[A-Z]{0,3})\b/i,
    /\b(Intel\s+N[12]\d{2}[A-Z]?)\b/i,                  // Intel N100, N200, N305
    // Bare CPU family — for URL slugs that omit "AMD"/"Intel" prefix
    /\b(Ryzen\s+(?:PRO\s+)?[3579]\s+(?:PRO\s+)?\d{4}[A-Z]{0,3})\b/i,
    /\b(Core\s+Ultra\s+[579]\s+\d{3}[A-Z]{0,2})\b/i,
    /\b(Core\s+[Ui][0-9]-\d{4,5}[A-Z]{0,3})\b/i,
    /\b(N[12]\d{2}[A-Z]?)\b/,                            // bare "N100" / "N200"
    /\b(Apple\s+M[0-9]+(?:\s+(?:Pro|Max|Ultra))?)\b/i,   // Apple M1/M2/M3/M4
    /\b(A\d{2}\s+Bionic)\b/i,                            // Apple A15 Bionic, A16 Bionic etc.
    /\b(Qualcomm\s+Snapdragon\s+\d+\s+Gen\s+\d+)\b/i,
    /\b(Qualcomm\s+Snapdragon\s+[\w+]+)\b/i,
    /\b(Snapdragon\s+\d+\s+Gen\s+\d+)\b/i,               // bare "Snapdragon 8 Gen 2"
    /\b(Snapdragon\s+\d+[A-Z]*)\b/i,
    /\b(MediaTek\s+Dimensity\s+\d+[A-Z]*)\b/i,
    /\b(MediaTek\s+Helio\s+[A-Z0-9]+)\b/i,
    /\b(MediaTek\s+G\d+[A-Z]*)\b/i,
    /\b(Dimensity\s+\d+[A-Z]*)\b/i,                      // bare "Dimensity 9200"
    /\b(Helio\s+[A-Z]\d+)\b/i,                           // bare "Helio G85"
    /\b(Samsung\s+Exynos\s+\d+)\b/i,
    /\b(Exynos\s+\d+)\b/i,
    /\b(Celeron\s+[N\d]\d+|Pentium\s+[N\d]\d+)\b/i,
    // Bare CPU family without model number — lowest priority, for slugs that omit the model
    /\b(AMD\s+Ryzen\s+[3579])\b/i,
    /\b(Intel\s+Core\s+[Ui][3579])\b/i,
  ];
  for (const pat of cpuPatterns) {
    const m = cleanTitle.match(pat);
    if (m) {
      specs.cpu = m[1];
      const inferredGPU = inferGPUFromCPU(m[1]);
      if (inferredGPU) specs.gpu = inferredGPU;
      break;
    }
  }

  // Normalise bare CPU family names: "Ryzen 5 7520U" → "AMD Ryzen 5 7520U"
  if (specs.cpu) {
    if (/^Ryzen\s+[3579]/i.test(specs.cpu) && !/^AMD/i.test(specs.cpu)) {
      specs.cpu = 'AMD ' + specs.cpu;
      const g = inferGPUFromCPU(specs.cpu);
      if (g) specs.gpu = g;
    } else if (/^Core\s+[Ui]/i.test(specs.cpu) && !/^Intel/i.test(specs.cpu)) {
      specs.cpu = 'Intel ' + specs.cpu;
      const g = inferGPUFromCPU(specs.cpu);
      if (g) specs.gpu = g;
    }
  }

  // Device storage fallback: bare "512GB", "128GB", "64GB" etc. without SSD/HDD qualifier.
  // Must run BEFORE the bare RAM fallback — "64GB" in a phone slug is storage, not RAM.
  if (!specs.storageGb) {
    const storageM = cleanTitle.match(/\b(32|64|128|256|512|1024)\s*GB\b/i) ??
      cleanTitle.match(/\b1\s*TB\b/i);
    if (storageM) {
      const raw = storageM[0];
      if (/1\s*TB/i.test(raw)) {
        specs.storageGb = 1024;
        specs.storage = '1TB';
      } else {
        const gb = parseInt(storageM[1]);
        // For 32/64: only claim as storage when no RAM qualifier was found for that value.
        // 128+ is always storage in a bare-GB context.
        if (gb >= 128 || (gb >= 32 && !specs.ramGb)) {
          specs.storageGb = gb;
          specs.storage = `${gb}GB`;
        }
      }
    }
  }

  // RAM fallback: bare "16GB" or "8 GB" without qualifier (common in URL slugs)
  // Only applies when strict pattern found nothing and the value is a known RAM size.
  if (!specs.ramGb) {
    const bareRamM = cleanTitle.match(/\b(4|6|8|10|12|16|24|32|48|64)\s*GB\b/i);
    if (bareRamM) {
      const candidate = parseInt(bareRamM[1]);
      // Exclude if this number is already claimed as storage
      if (!specs.storageGb || candidate !== specs.storageGb) {
        specs.ramGb = candidate;
        specs.ram = `${candidate}GB`;
      }
    }
  }

  // Display size: "15.6-inch", "14 inch", "6.7"" OR bare "15.6 FHD" / "14 FHD" (URL slugs)
  const sizeM = cleanTitle.match(/\b(\d+(?:\.\d+)?)[- ]?(?:inch|")\b/i) ??
    cleanTitle.match(/\b(\d{2}\.\d)\s+(?:FHD|QHD|UHD|HD|IPS|OLED|AMOLED)/i);
  if (sizeM) {
    const size = sizeM[1];
    const hasFHD = /\b(?:FHD|Full[- ]?HD)\b/i.test(cleanTitle);
    const hasHD = /\bHD\b/i.test(cleanTitle) && !hasFHD;
    const hasQHD = /\b(?:QHD|2K|WQHD)\b/i.test(cleanTitle);
    const hasUHD = /\b(?:UHD|4K|OLED|AMOLED)\b/i.test(cleanTitle);
    specs.display = `${size}-inch${hasUHD ? ' UHD' : hasQHD ? ' QHD' : hasFHD ? ' FHD' : hasHD ? ' HD' : ''}`;
  }

  // OS — includes iOS for iPhones/iPads; also bare "Windows" → "Windows 11"
  const osM = cleanTitle.match(/\b(Windows\s+\d+(?:\s+(?:Home|Pro|S|Education))?|macOS\s+\w+|iOS\s*\d*|Android\s+\d+)\b/i);
  if (osM) {
    specs.operatingSystem = osM[1].trim();
  } else if (/\bWindows\b/i.test(cleanTitle)) {
    specs.operatingSystem = 'Windows'; // bare — version unknown from slug
  }

  return specs;
}

/**
 * Normalises a block of raw specs text (pasted from product page or spec table).
 * Combines title-level extraction with detailed pattern matching.
 */
export function normaliseSpecsFromText(text: string): DeviceSpecs {
  if (!text) return { rawText: '' };

  const fromTitle = normaliseSpecsFromTitle(text);

  // RAM — "Memory:" label on phone pages often means storage (ROM), not RAM.
  // Only trust bare "Memory: XGB" as RAM when the value is a plausible RAM size (≤ 32GB).
  const hasInternalMemoryLabel = /internal\s+memory/i.test(text);
  let ramM = text.match(/(\d+)\s*GB\s+(?:LPDDR\w*|DDR\w*|RAM)/i) ??
    text.match(/RAM[:\s]+(\d+)\s*GB/i) ?? null;
  if (!ramM && !hasInternalMemoryLabel) {
    const memM = text.match(/Memory[:\s]+(\d+)\s*GB/i);
    if (memM && parseInt(memM[1]) <= 32) ramM = memM;
  }
  const ramGb = ramM ? parseInt(ramM[1]) : (fromTitle.ramGb ?? null);

  const rtM = text.match(/\b(LPDDR5X?|LPDDR4X?|DDR5|DDR4|DDR3)\b/i);
  const ramType = rtM ? rtM[1].toUpperCase() : (fromTitle.ramType ?? null);

  // Storage — "Internal Memory" on phone pages means storage, not RAM
  const stM = text.match(/(\d+)\s*(GB|TB)\s*(?:NVMe|SSD|HDD|eMMC)/i) ??
    text.match(/(?:Internal\s+)?Storage[:\s]+(\d+)\s*(GB|TB)/i) ??
    text.match(/Internal\s+Memory[:\s]+(\d+)\s*(GB|TB)/i) ??
    text.match(/Memory\s+Storage[^:]*:\s*(\d+)\s*(GB|TB)/i); // Amazon "Memory Storage Capacity: 512 GB"
  let storageGb: number | null = fromTitle.storageGb ?? null;
  if (stM) {
    const val = parseInt(stM[1]);
    storageGb = stM[2].toUpperCase() === 'TB' ? val * 1024 : val;
  }

  let storageType: string | null = fromTitle.storageType ?? null;
  if (!storageType) {
    if (/nvme/i.test(text)) storageType = 'NVMe';
    else if (/emmc/i.test(text)) storageType = 'eMMC';
    else if (/\bssd\b/i.test(text)) storageType = 'SSD';
    else if (/hdd|hard\s*disk|hard\s*drive/i.test(text)) storageType = 'HDD';
  }

  // CPU
  let cpu: string | null = fromTitle.cpu ?? null;
  if (!cpu) {
    const cpuM = text.match(/Processor[:\s]+([^\n\r,]{5,80})/i) ??
      text.match(/CPU[:\s]+([^\n\r,]{5,80})/i) ??
      text.match(/Chip[:\s]+(A\d{2}\s+Bionic[^\n\r,]{0,20})/i) ??
      text.match(/\b(A\d{2}\s+Bionic)\b/i);
    if (cpuM) cpu = cpuM[1].trim().slice(0, 100);
  }

  // GPU
  let gpu: string | null = fromTitle.gpu ?? null;
  if (!gpu) {
    const gpuM = text.match(/(?:GPU|Graphics(?:\s+Card|s)?)[:\s]+([^\n\r,]{3,80})/i) ??
      text.match(/\b(NVIDIA\s+(?:GeForce\s+)?(?:RTX|GTX)\s+\d\S+|AMD\s+Radeon\s+(?:RX\s+)?\w+|Intel\s+(?:Iris|Arc|UHD)\s+\w*)\b/i);
    gpu = gpuM ? (gpuM[1] ?? gpuM[0]).trim().slice(0, 80) : null;
    if (!gpu && cpu) gpu = inferGPUFromCPU(cpu);
  }

  // Display
  let display: string | null = fromTitle.display ?? null;
  if (!display) {
    const dM = text.match(/Display[:\s]+([^\n\r]{5,100})/i) ??
      text.match(/Screen[:\s]+([^\n\r]{5,80})/i);
    if (dM) display = dM[1].trim().slice(0, 100);
  }
  // Append resolution if found and not already in display
  const resM = text.match(/(?:Resolution)[:\s]+([\d\s×xX]+(?:\s*pixels?)?)/i) ??
    text.match(/\b(1920\s*[×xX]\s*1080|2560\s*[×xX]\s*1440|3840\s*[×xX]\s*2160|1366\s*[×xX]\s*768)\b/);
  if (resM) {
    const res = (resM[1] ?? resM[0]).trim();
    if (display && !display.includes(res)) display = `${display} · ${res}`;
    else if (!display) display = res;
  }

  // Battery
  const batM = text.match(/Battery[:\s]+([^\n\r]{3,60})/i) ??
    text.match(/(\d+(?:\.\d+)?)\s*(?:Wh|watt[- ]?hour)/i) ??
    text.match(/\b(\d{4,5})\s*mAh\b/i);
  const battery = batM ? batM[0].trim().slice(0, 60) : null;

  // OS — includes iOS
  const osM = text.match(/(?:Operating\s+System|OS)[:\s]+(Windows[^\n\r,]{0,30}|macOS[^\n\r,]{0,20}|iOS[^\n\r,]{0,20}|Android[^\n\r,]{0,20}|Ubuntu[^\n\r,]{0,20})/i) ??
    text.match(/\b(Windows\s+\d+(?:\s+(?:Home|Pro|S|Education))?|macOS\s+\w+|iOS\s*\d*|Android\s+\d+(?:\s+\w+)?)\b/i);
  const operatingSystem: string | null = osM ? (osM[1] ?? osM[0]).trim().slice(0, 60) : (fromTitle.operatingSystem ?? null);

  // Weight
  const wM = text.match(/Weight[:\s]+([\d.]+\s*(?:kg|lbs?|g\b))/i) ??
    text.match(/\b(\d+\.\d+)\s*kg\b/i);
  const weight = wM ? (wM[1] ?? wM[0]).trim().slice(0, 30) : null;

  // Warranty
  const warM = text.match(/Warranty[:\s]+([^\n\r]{5,80})/i) ??
    text.match(/(\d+)\s*(?:year|yr)[^\n\r]{0,30}(?:warranty|guarantee)/i);
  const warranty = warM ? (warM[1] ?? warM[0]).trim().slice(0, 80) : null;

  // Ports — USB-C, USB 3.x, HDMI
  const portParts: string[] = [];
  const usbcM = text.match(/(\d+)\s*[x×]\s*USB[- ]?(?:Type[- ]?C|C)\b/i) ??
    text.match(/USB[- ]?(?:Type[- ]?C|C)[:\s]+(\d+)/i) ??
    text.match(/USB[- ]?(?:Type[- ]?C|C)(?:\s+port)?/i);
  if (usbcM) portParts.push(usbcM[0].trim().slice(0, 40));

  const usb3M = text.match(/(\d+)\s*[x×]\s*USB\s+3[\.\d]*/i) ??
    text.match(/USB\s+3[\.\d]+[^\n\r]{0,20}/i);
  if (usb3M) portParts.push(usb3M[0].trim().slice(0, 40));

  const hdmiM = text.match(/HDMI[^\n\r]{0,30}/i);
  if (hdmiM) portParts.push(hdmiM[0].trim().slice(0, 30));

  const ports = portParts.length > 0 ? portParts.join(', ') : null;

  // Connectivity
  const connParts: string[] = [];
  if (/wi[- ]?fi|wireless\s*lan|wlan/i.test(text)) connParts.push('Wi-Fi');
  if (/bluetooth/i.test(text)) connParts.push('Bluetooth');
  if (/\b(?:ethernet|rj[-\s]?45|gigabit\s+lan)\b/i.test(text)) connParts.push('Ethernet');
  const connectivity = connParts.length > 0 ? connParts.join(', ') : null;

  // Camera — includes MP ratings for phones
  const camM = text.match(/(?:Camera|Webcam)[:\s]+([^\n\r,]{3,60})/i) ??
    text.match(/\b(720p|HD\s+(?:Web)?[Cc]am|1080p|FHD\s+(?:Web)?[Cc]am)\b/i) ??
    text.match(/\b(\d+\s*MP\s*(?:Main|Front|Rear|Ultra\s*Wide|Wide)?(?:\s*\+\s*\d+\s*MP)?)\b/i);
  const camera = camM ? (camM[1] ?? camM[0]).trim().slice(0, 80) : null;

  return {
    cpu,
    gpu,
    ram: ramGb ? `${ramGb}GB${ramType ? ' ' + ramType : ''}` : null,
    ramGb,
    ramType,
    storage: storageGb
      ? `${storageGb >= 1024 ? `${storageGb / 1024}TB` : `${storageGb}GB`} ${storageType ?? ''}`.trim()
      : null,
    storageGb,
    storageType,
    display,
    battery,
    operatingSystem,
    ports,
    connectivity,
    weight,
    warranty,
    camera,
    rawText: text,
  };
}
