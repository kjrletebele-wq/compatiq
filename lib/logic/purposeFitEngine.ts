import type { DeviceCategory, DeviceSpecs, Purpose } from '@/lib/types/device';
import type { PurposeFitResult, SuitabilityRating } from '@/lib/types/advisory';

type RAMTier = 'low' | 'mid' | 'high' | 'pro' | 'unknown';
type CPUTier = 'weak' | 'mid' | 'strong' | 'pro' | 'unknown';
type StorageTier = 'ssd' | 'hdd' | 'emmc' | 'unknown';
type DisplayTier = 'excellent' | 'good' | 'basic' | 'unknown';

function getRAMTier(specs: DeviceSpecs): RAMTier {
  const gb = specs.ramGb;
  if (!gb) return 'unknown';
  if (gb < 8) return 'low';
  if (gb <= 15) return 'mid';
  if (gb <= 31) return 'high';
  return 'pro';
}

function getCPUTier(specs: DeviceSpecs): CPUTier {
  const cpu = (specs.cpu ?? '').toLowerCase();
  if (!cpu) return 'unknown';
  if (/celeron|pentium|atom/.test(cpu)) return 'weak';
  if (/\bi3\b|ryzen 3/.test(cpu)) return 'weak';
  if (/\bi5\b|ryzen 5|core ultra 5/.test(cpu)) return 'mid';
  if (/\bi7\b|ryzen 7|core ultra 7|m1|m2|tensor/.test(cpu)) return 'strong';
  if (/\bi9\b|ryzen 9|core ultra 9|m3 pro|m3 max|m2 pro|m2 max/.test(cpu)) return 'pro';
  return 'mid';
}

function getStorageTier(specs: DeviceSpecs): StorageTier {
  const st = (specs.storageType ?? '').toLowerCase();
  if (!st) return 'unknown';
  if (st.includes('nvme') || st.includes('ssd')) return 'ssd';
  if (st.includes('emmc')) return 'emmc';
  if (st.includes('hdd')) return 'hdd';
  return 'unknown';
}

function hasDiscreteGPU(specs: DeviceSpecs): boolean | null {
  const gpu = (specs.gpu ?? '').toLowerCase();
  if (!gpu) return null;
  if (/nvidia|rtx|gtx|radeon rx|radeon r[0-9]|rx [0-9]/.test(gpu)) return true;
  if (/intel iris|intel uhd|intel arc a[0-9]|amd radeon vega|amd radeon graphics|apple/.test(gpu)) return false;
  return null;
}

function getDisplayTier(specs: DeviceSpecs): DisplayTier {
  const d = (specs.display ?? '').toLowerCase();
  if (!d) return 'unknown';
  if (/oled|amoled|retina xdr|qhd\+|4k|2\.8k|3\.5k|120hz.*oled/.test(d)) return 'excellent';
  if (/fhd\+|1200p|120hz|ips.*1080/.test(d)) return 'good';
  if (/fhd|1080p|1920x1080/.test(d)) return 'basic';
  return 'unknown';
}

// ─── Smartphone detection + chip tier ────────────────────────────────────────

function isSmartphone(category?: DeviceCategory, specs?: DeviceSpecs | null): boolean {
  if (category === 'Smartphone') return true;
  const cpu = (specs?.cpu ?? '').toLowerCase();
  if (/\ba\d{2}\s+bionic\b|\ba\d{2}\s+(?:pro|chip)\b/i.test(cpu)) return true;
  if (/snapdragon|dimensity|mediatek|helio|exynos/i.test(cpu)) return true;
  const os = (specs?.operatingSystem ?? '').toLowerCase();
  if (/^ios|^android/.test(os)) return true;
  return false;
}

type PhoneChipTier = 'flagship' | 'high' | 'mid' | 'entry' | 'unknown';

function getPhoneChipTier(cpu: string): PhoneChipTier {
  const c = cpu.toLowerCase();
  // Apple A-series
  if (/a1[6-9]\s+(?:bionic|pro|chip)|a1[5-9]\s+bionic/i.test(c)) return 'flagship';
  if (/a1[3-4]\s+bionic/i.test(c)) return 'high';
  if (/a12\s+bionic/i.test(c)) return 'mid';
  // Qualcomm Snapdragon
  if (/snapdragon\s+8\s+gen\s+[23]|snapdragon\s+8[+\s]gen/i.test(c)) return 'flagship';
  if (/snapdragon\s+8\s+gen\s+1|snapdragon\s+888|snapdragon\s+8[56][0-9]/i.test(c)) return 'high';
  if (/snapdragon\s+7\s+gen\s+[123]|snapdragon\s+7[5-9][0-9]/i.test(c)) return 'high';
  if (/snapdragon\s+7[0-4][0-9]|snapdragon\s+6[5-9][0-9]/i.test(c)) return 'mid';
  if (/snapdragon\s+[46][0-9][0-9]/i.test(c)) return 'entry';
  // MediaTek Dimensity (flagship/high)
  if (/dimensity\s+9\d{3}/i.test(c)) return 'flagship';
  if (/dimensity\s+[78]\d{3}/i.test(c)) return 'high';
  if (/dimensity\s+[1-6]\d{3}/i.test(c)) return 'mid';
  // MediaTek G-series (gaming)
  if (/(?:mediatek\s+)?(?:helio\s+)?g9[0-9]/i.test(c)) return 'high'; // G90T, G99
  if (/(?:mediatek\s+)?(?:helio\s+)?g8[0-9]/i.test(c)) return 'mid';  // G80, G85, G88
  if (/(?:mediatek\s+)?(?:helio\s+)?g[2-7][0-9]/i.test(c)) return 'entry'; // G35, G70
  // MediaTek Helio P/A series
  if (/helio\s+p\d+/i.test(c)) return 'mid';
  if (/helio\s+[ag]\d+/i.test(c)) return 'entry';
  // Samsung Exynos
  if (/exynos\s*2[23]\d{2}/i.test(c)) return 'flagship';
  if (/exynos\s*2[01]\d{2}/i.test(c)) return 'high';
  if (/exynos\s*1[0-9]\d{2}/i.test(c)) return 'mid';
  return 'unknown';
}

function evaluateSmartphone(specs: DeviceSpecs | null, purpose: Purpose): PurposeFitResult {
  const cpu = specs?.cpu ?? '';
  const chipTier: PhoneChipTier = cpu ? getPhoneChipTier(cpu) : 'unknown';
  const chipLabel = cpu || 'smartphone chip';
  const storageLabel = specs?.storageGb
    ? (specs.storageGb >= 1024 ? `${specs.storageGb / 1024}TB` : `${specs.storageGb}GB`)
    : null;
  const isIOS = /ios/i.test(specs?.operatingSystem ?? '') || /bionic/i.test(chipLabel);

  switch (purpose) {
    case 'PersonalUse':
    case 'PhotographyMobileContent': {
      const isFlagship = chipTier === 'flagship' || chipTier === 'high';
      const photoParts: string[] = [];
      if (cpu) photoParts.push(`${cpu} delivers excellent everyday performance`);
      if (storageLabel) photoParts.push(`${storageLabel} of storage for apps, photos, and media`);
      if (isIOS) photoParts.push('iOS provides a smooth, secure experience with a large app ecosystem');
      photoParts.push(purpose === 'PhotographyMobileContent'
        ? 'excellent for photography, video recording, social media, and content sharing'
        : 'great for browsing, streaming, social media, messaging, and video calls');
      return {
        purpose,
        rating: isFlagship || chipTier === 'unknown' ? 'StrongFit' : 'GoodFit',
        explanation: photoParts.join('. ') + '.',
        shouldWorkWellWith: purpose === 'PhotographyMobileContent'
          ? ['Camera apps', 'Instagram', 'TikTok', 'Snapchat', 'CapCut', 'Lightroom Mobile', 'YouTube']
          : ['Browsing', 'YouTube', 'Netflix', 'WhatsApp', 'Email', 'Google Maps', 'Social media'],
        mayStruggleWith: ['Desktop-class video editing', 'Large file transfers without USB-C accessories'],
        bottlenecks: [],
        minimumRecommendedSpecs: [],
        missingInformation: [],
        confidence: cpu ? 'high' : 'medium',
      };
    }

    case 'Gaming': {
      const isFlagship = chipTier === 'flagship';
      const isHigh = chipTier === 'high';
      const rating: SuitabilityRating = isFlagship ? 'GoodFit' : isHigh ? 'GoodFit' : chipTier === 'mid' ? 'UsableWithLimits' : 'NotIdeal';
      return {
        purpose: 'Gaming',
        rating,
        explanation: isFlagship || isHigh
          ? `${chipLabel} handles mobile gaming excellently. Games like PUBG Mobile, Genshin Impact, Call of Duty Mobile, and Fortnite run smoothly. Note: PC and console games cannot be played on a smartphone.`
          : chipTier === 'mid'
            ? `${chipLabel} handles casual and mid-tier mobile games. Demanding titles like Genshin Impact may require reduced graphics settings.`
            : `This device's chip may struggle with demanding mobile games. Casual titles should work fine.`,
        shouldWorkWellWith: isFlagship || isHigh
          ? ['PUBG Mobile', 'Call of Duty Mobile', 'Genshin Impact', 'Fortnite Mobile', 'EA Sports FC Mobile']
          : ['Casual games', 'Puzzle games', 'Hyper-casual titles'],
        mayStruggleWith: ['PC/console gaming (not available on smartphones)', 'Emulators on lower-end chips'],
        bottlenecks: chipTier === 'entry' ? [`${chipLabel} may overheat or throttle during extended gaming`] : [],
        minimumRecommendedSpecs: ['Flagship-tier chip for demanding titles', 'Good cooling for sustained gaming'],
        missingInformation: [],
        confidence: cpu ? 'high' : 'medium',
      };
    }

    case 'VideoEditing': {
      const isFlagship = chipTier === 'flagship' || chipTier === 'high';
      return {
        purpose: 'VideoEditing',
        rating: isFlagship ? 'GoodFit' : 'UsableWithLimits',
        explanation: isFlagship
          ? `${chipLabel} enables smooth mobile video editing. ${isIOS ? 'iMovie, CapCut, and LumaFusion' : 'CapCut and KineMaster'} run well for social media and short-form content. Desktop apps like Premiere Pro and DaVinci Resolve are not available on smartphones.`
          : `Basic video editing with CapCut or simple clip trimming is possible. Complex multi-track edits and 4K exports may be slow.`,
        shouldWorkWellWith: isIOS ? ['iMovie', 'CapCut', 'LumaFusion', 'Splice'] : ['CapCut', 'KineMaster', 'InShot'],
        mayStruggleWith: ['Premiere Pro / DaVinci Resolve (desktop-only)', '4K multi-track editing', 'Complex effects on lower-end chips'],
        bottlenecks: isFlagship ? [] : [`${chipLabel} may slow down on complex 4K timelines`],
        minimumRecommendedSpecs: ['Flagship chip for smooth 4K editing', 'Large storage for video files'],
        missingInformation: [],
        confidence: cpu ? 'high' : 'medium',
      };
    }

    case 'ContentCreation': {
      const isFlagship = chipTier === 'flagship' || chipTier === 'high';
      return {
        purpose: 'ContentCreation',
        rating: isFlagship ? 'GoodFit' : 'UsableWithLimits',
        explanation: isFlagship
          ? `${chipLabel} makes this a capable mobile content creation device. Shoot, edit, and publish directly from the phone using CapCut, Canva, and social apps. Ideal for short-form video, photography, and on-the-go creators.`
          : `Suitable for basic content creation including photography and simple video edits. Demanding production workflows benefit from a more powerful chip.`,
        shouldWorkWellWith: ['CapCut', 'Canva', 'Instagram', 'TikTok', 'Lightroom Mobile', 'Camera apps'],
        mayStruggleWith: ['Professional-grade color grading', 'Complex motion graphics'],
        bottlenecks: [],
        minimumRecommendedSpecs: ['Flagship chip and good camera system for best results'],
        missingInformation: [],
        confidence: cpu ? 'high' : 'medium',
      };
    }

    case 'School':
    case 'OfficeAdmin':
    case 'WorkBusiness':
    case 'AccountingFinance': {
      const label = purpose === 'School' ? 'school' : purpose === 'AccountingFinance' ? 'basic accounting' : 'office and work';
      return {
        purpose,
        rating: purpose === 'AccountingFinance' ? 'UsableWithLimits' : 'GoodFit',
        explanation: `Suitable for ${label} tasks on the go. ${isIOS ? 'Microsoft 365, Google Workspace, and Apple productivity apps' : 'Microsoft 365 and Google Workspace apps'} work well for email, notes, document viewing, and video calls. For extended typing-heavy or spreadsheet-heavy work, a laptop is recommended.`,
        shouldWorkWellWith: ['Microsoft 365 mobile', 'Google Workspace', 'Zoom', 'Teams', 'Outlook', 'Notes'],
        mayStruggleWith: ['Complex spreadsheet editing', 'Large document formatting', 'Multi-window workflows on small screens'],
        bottlenecks: ['Small screen limits productivity for extended work sessions'],
        minimumRecommendedSpecs: [],
        missingInformation: [],
        confidence: 'high',
      };
    }

    case 'GraphicDesign':
      return {
        purpose: 'GraphicDesign',
        rating: 'UsableWithLimits',
        explanation: `Mobile graphic design is possible with Canva, Adobe Express, and Procreate (iOS). Professional tools like Photoshop, Illustrator, and Figma are desktop-first — the mobile apps have significant limitations. ${chipLabel} handles mobile design apps without issue.`,
        shouldWorkWellWith: ['Canva', 'Adobe Express', isIOS ? 'Procreate' : 'Sketchbook', 'Lightroom Mobile'],
        mayStruggleWith: ['Photoshop (full desktop version)', 'Illustrator', 'Figma (desktop features)'],
        bottlenecks: ['Small screen and lack of mouse/keyboard limit professional design workflows'],
        minimumRecommendedSpecs: ['A tablet may be better suited for graphic design work'],
        missingInformation: [],
        confidence: 'high',
      };

    case 'ProgrammingCoding':
    case 'EngineeringCAD':
    case 'ThreeDDesignBlender':
    case 'HeavyMultitasking': {
      const workLabel = purpose === 'ProgrammingCoding' ? 'software development IDEs (VS Code, JetBrains, Android Studio)'
        : purpose === 'EngineeringCAD' ? 'CAD software (AutoCAD, Revit, SolidWorks)'
        : purpose === 'ThreeDDesignBlender' ? '3D design tools (Blender, Cinema 4D, Maya)'
        : 'heavy multitasking across demanding desktop applications';
      return {
        purpose,
        rating: 'NotIdeal',
        explanation: `Smartphones cannot run ${workLabel}. A laptop or desktop computer is required for this type of work.`,
        shouldWorkWellWith: ['Mobile equivalents and companion apps only'],
        mayStruggleWith: [workLabel],
        bottlenecks: ['Smartphones lack the desktop OS and software required for this purpose'],
        minimumRecommendedSpecs: ['A laptop or desktop is required'],
        missingInformation: [],
        confidence: 'high',
      };
    }

    default:
      return evaluateSmartphone(specs, 'PersonalUse');
  }
}

function countMissing(specs: DeviceSpecs | null): string[] {
  if (!specs) return ['CPU', 'GPU', 'RAM', 'Storage type', 'Display'];
  const missing: string[] = [];
  if (!specs.cpu) missing.push('CPU');
  if (!specs.ramGb) missing.push('RAM amount');
  if (!specs.storageType && !specs.storage) missing.push('Storage type');
  if (!specs.display) missing.push('Display');
  // Only flag GPU as missing if CPU does not imply an integrated GPU
  const cpuImpliesIntegrated = specs.cpu
    ? /ryzen [3579] [4-9]\d{3}|core i[0-9]|core ultra|apple m[0-9]/i.test(specs.cpu)
    : false;
  if (!specs.gpu && !cpuImpliesIntegrated) missing.push('GPU');
  return missing;
}

function inferConfidence(missing: string[]): 'high' | 'medium' | 'low' {
  if (missing.length === 0) return 'high';
  if (missing.length <= 2) return 'medium';
  return 'low';
}

export function evaluatePurposeFit(specs: DeviceSpecs | null, purpose: Purpose, category?: DeviceCategory): PurposeFitResult {
  if (isSmartphone(category, specs)) {
    return evaluateSmartphone(specs, purpose);
  }

  const missing = countMissing(specs);
  const confidence = inferConfidence(missing);
  const ram = specs ? getRAMTier(specs) : 'unknown';
  const cpu = specs ? getCPUTier(specs) : 'unknown';
  const storage = specs ? getStorageTier(specs) : 'unknown';
  const discrete = specs ? hasDiscreteGPU(specs) : null;
  const display = specs ? getDisplayTier(specs) : 'unknown';

  if (missing.length >= 5) {
    return {
      purpose,
      rating: 'NotEnoughInformation',
      explanation: 'Not enough specifications are available to assess suitability for this purpose. Enter specs manually or use the spec text field to improve advisory quality.',
      shouldWorkWellWith: [],
      mayStruggleWith: [],
      bottlenecks: ['Insufficient specifications provided'],
      minimumRecommendedSpecs: [],
      missingInformation: missing,
      confidence: 'low',
    };
  }

  switch (purpose) {
    case 'GraphicDesign':
      return evaluateGraphicDesign(ram, cpu, storage, discrete, display, missing, confidence);
    case 'VideoEditing':
      return evaluateVideoEditing(ram, cpu, storage, discrete, display, missing, confidence);
    case 'ProgrammingCoding':
      return evaluateProgramming(ram, cpu, storage, missing, confidence);
    case 'EngineeringCAD':
      return evaluateEngineeringCAD(ram, cpu, storage, discrete, missing, confidence);
    case 'AccountingFinance':
      return evaluateAccounting(ram, cpu, storage, missing, confidence);
    case 'Gaming':
      return evaluateGaming(ram, cpu, storage, discrete, missing, confidence);
    case 'ThreeDDesignBlender':
      return evaluateThreeDDesign(ram, cpu, storage, discrete, missing, confidence);
    case 'HeavyMultitasking':
      return evaluateHeavyMultitasking(ram, cpu, storage, missing, confidence);
    case 'ContentCreation':
      return evaluateContentCreation(ram, cpu, storage, discrete, display, missing, confidence);
    case 'School':
    case 'OfficeAdmin':
    case 'WorkBusiness':
      return evaluateOfficeWork(ram, cpu, storage, missing, confidence, purpose);
    case 'PersonalUse':
    case 'PhotographyMobileContent':
      return evaluatePersonalUse(ram, cpu, storage, missing, confidence, purpose, specs);
    default:
      return evaluateOfficeWork(ram, cpu, storage, missing, confidence, purpose);
  }
}

function evaluateGraphicDesign(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier, discrete: boolean | null,
  display: DisplayTier, missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if (ram === 'pro' || ram === 'high') {
    if (discrete && display === 'excellent') {
      rating = 'StrongFit';
      explanation = 'This device should handle graphic design well. High RAM, dedicated GPU, and an excellent display make it suitable for Photoshop, Illustrator, Figma, Lightroom, and moderate Blender work.';
    } else if (display === 'good' || display === 'excellent') {
      rating = 'GoodFit';
      explanation = 'Good RAM and display make this suitable for Figma, Illustrator, Canva, and Photoshop. For Blender or heavy 3D rendering, a dedicated GPU would help.';
    } else {
      rating = 'GoodFit';
      explanation = 'High RAM supports graphic design work. Display quality and GPU details were not fully confirmed.';
    }
  } else if (ram === 'mid') {
    rating = 'UsableWithLimits';
    explanation = 'This device can run Canva, Figma, and basic Illustrator, but may struggle with large Photoshop files, batch Lightroom exports, or 3D work.';
    bottlenecks.push('RAM may limit large files and multitasking');
  } else if (ram === 'low') {
    rating = 'NotIdeal';
    explanation = 'Less than 8GB RAM will limit graphic design work significantly. Most professional tools will be slow or unusable.';
    bottlenecks.push('Low RAM is a major bottleneck for graphic design');
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'RAM information is missing. Cannot confidently assess graphic design suitability.';
  }

  if (discrete === false) bottlenecks.push('No dedicated GPU — Blender, 3D rendering, and heavy Photoshop GPU tasks will be slow');
  if (display !== 'excellent' && display !== 'unknown') bottlenecks.push('Display colour accuracy may limit professional design work');
  if (storage === 'hdd') bottlenecks.push('HDD storage will slow file operations — SSD recommended for design work');

  return {
    purpose: 'GraphicDesign',
    rating,
    explanation,
    shouldWorkWellWith: ['Photoshop', 'Illustrator', 'Canva', 'Figma', 'Lightroom', 'Affinity Designer'],
    mayStruggleWith: ['Blender (heavy 3D)', 'Large Photoshop batch exports', '8K media editing'],
    bottlenecks,
    minimumRecommendedSpecs: ['16GB RAM recommended', 'SSD storage', 'Good colour-accurate display', 'Dedicated GPU helpful'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateVideoEditing(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier, discrete: boolean | null,
  display: DisplayTier, missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if ((ram === 'pro' || ram === 'high') && discrete && storage === 'ssd') {
    rating = 'StrongFit';
    explanation = 'Strong RAM, dedicated GPU, and SSD make this device well-suited for video editing including 4K timelines, DaVinci Resolve, and Premiere Pro.';
  } else if ((ram === 'high' || ram === 'mid') && discrete) {
    rating = 'GoodFit';
    explanation = 'Dedicated GPU and reasonable RAM should handle Premiere Pro, DaVinci Resolve, and CapCut editing. 4K multicam or heavy effects may be slow.';
    if (storage === 'hdd') bottlenecks.push('HDD storage will cause slow project loading and renders');
  } else if (ram === 'high' || ram === 'pro') {
    rating = 'UsableWithLimits';
    explanation = 'High RAM allows editing, but no dedicated GPU means CPU-only rendering — export times will be long for 4K or effects-heavy projects.';
    bottlenecks.push('No dedicated GPU — rendering will be CPU-only and slow');
  } else if (ram === 'mid') {
    rating = 'UsableWithLimits';
    explanation = 'Basic video editing with CapCut or simple timelines is possible. DaVinci Resolve and 4K editing will struggle significantly.';
    bottlenecks.push('Low RAM for professional video editing');
  } else {
    rating = 'NotIdeal';
    explanation = 'Video editing requires at least 16GB RAM and preferably a dedicated GPU. This device may not meet those requirements.';
    bottlenecks.push('Insufficient RAM and/or no GPU');
  }

  if (storage === 'hdd') bottlenecks.push('SSD strongly recommended — HDD causes major slowdowns in video editing');

  return {
    purpose: 'VideoEditing',
    rating,
    explanation,
    shouldWorkWellWith: ['CapCut', 'Premiere Pro (if GPU)', 'DaVinci Resolve (if GPU+RAM)', 'Final Cut Pro (Mac only)'],
    mayStruggleWith: ['4K multicam without dedicated GPU', 'DaVinci Fusion 3D effects', 'Long exports on weak hardware'],
    bottlenecks,
    minimumRecommendedSpecs: ['16GB RAM minimum, 32GB better', 'Dedicated GPU preferred', 'SSD required', 'Good display'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateProgramming(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier,
  missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if ((ram === 'high' || ram === 'pro') && (cpu === 'strong' || cpu === 'pro') && storage === 'ssd') {
    rating = 'StrongFit';
    explanation = 'Strong CPU, high RAM, and SSD make this an excellent development machine. VS Code, JetBrains IDEs, Docker, Android Studio, and local databases should run well.';
  } else if (ram === 'high' || ram === 'mid') {
    if (storage === 'ssd') {
      rating = ram === 'high' ? 'GoodFit' : 'UsableWithLimits';
      explanation = ram === 'high'
        ? 'Good RAM and SSD support most development work. Docker and VMs may be limited depending on the number of containers.'
        : 'Adequate for VS Code and basic development, but Docker, Android Studio, and virtual machines will be slow.';
      if (ram === 'mid') bottlenecks.push('8GB RAM limits Docker, VMs, and running multiple development tools simultaneously');
    } else {
      rating = 'UsableWithLimits';
      explanation = 'HDD storage will significantly slow development workflows — project indexing, builds, and IDE startup will all be affected.';
      bottlenecks.push('HDD causes slow builds, indexing, and IDE performance');
    }
  } else {
    rating = 'NotIdeal';
    explanation = 'Low RAM limits serious development work. Running an IDE, Docker, a browser, and local tools simultaneously will be difficult.';
    bottlenecks.push('Insufficient RAM for development workflows');
  }

  if (cpu === 'weak') bottlenecks.push('Weak CPU will slow build times, compilation, and emulator performance');

  return {
    purpose: 'ProgrammingCoding',
    rating,
    explanation,
    shouldWorkWellWith: ['VS Code', 'JetBrains IDEs', 'Git', 'Node.js', 'Python', 'SQL databases'],
    mayStruggleWith: ['Docker with multiple containers', 'Android Studio emulators', 'Virtual machines', 'Heavy compilation workloads'],
    bottlenecks,
    minimumRecommendedSpecs: ['16GB RAM recommended', 'SSD required for good performance', 'Strong CPU helps for builds'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateEngineeringCAD(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier, discrete: boolean | null,
  missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if ((ram === 'high' || ram === 'pro') && (cpu === 'strong' || cpu === 'pro') && discrete && storage === 'ssd') {
    rating = 'StrongFit';
    explanation = 'Strong RAM, CPU, dedicated GPU, and SSD make this suitable for AutoCAD, Revit, SolidWorks, Fusion 360, and MATLAB.';
  } else if ((ram === 'high' || ram === 'pro') && discrete) {
    rating = 'GoodFit';
    explanation = 'Adequate for most CAD work. Large assemblies and real-time rendering may be limited by CPU or RAM.';
  } else if (ram === 'high' && !discrete) {
    rating = 'UsableWithLimits';
    explanation = 'CAD tools can run without a dedicated GPU, but 3D rendering and large assembly visualisation will be slow.';
    bottlenecks.push('No dedicated GPU — 3D rendering and large assemblies will struggle');
  } else if (ram === 'mid') {
    rating = 'NotIdeal';
    explanation = 'Engineering CAD tools typically need at least 16GB RAM. Revit, SolidWorks, and large models will struggle with 8GB.';
    bottlenecks.push('Insufficient RAM for CAD work');
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'Insufficient specification data to assess CAD suitability.';
  }

  if (storage === 'hdd') bottlenecks.push('SSD strongly recommended — large CAD files are slow on HDD');
  if (discrete === false) bottlenecks.push('Dedicated GPU recommended for viewport rendering and 3D CAD');

  return {
    purpose: 'EngineeringCAD',
    rating,
    explanation,
    shouldWorkWellWith: ['AutoCAD (2D)', 'Fusion 360 (if specs allow)', 'MATLAB', 'Bluebeam', 'Tekla'],
    mayStruggleWith: ['Revit large models', 'SolidWorks assemblies', '3D rendering without GPU', 'Simulation workloads'],
    bottlenecks,
    minimumRecommendedSpecs: ['16GB RAM minimum, 32GB better', 'Strong CPU', 'Dedicated GPU recommended', 'SSD required'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateAccounting(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier,
  missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if (ram === 'mid' || ram === 'high' || ram === 'pro') {
    if (storage === 'ssd') {
      rating = ram === 'mid' ? 'GoodFit' : 'StrongFit';
      explanation = 'Suitable for Excel, Sage, Xero, QuickBooks, Pastel, Teams, Zoom, and PDF work. SSD storage ensures fast file access.';
    } else {
      rating = 'UsableWithLimits';
      explanation = 'Can run accounting tools, but HDD will slow Excel file loading, Sage, and multitasking with Teams/Zoom.';
      bottlenecks.push('HDD storage slows large spreadsheet and application loading');
    }
  } else if (ram === 'low') {
    rating = 'UsableWithLimits';
    explanation = 'Basic accounting tasks are possible, but large Excel models, Sage with many records, and Zoom+Teams multitasking will be slow.';
    bottlenecks.push('Low RAM limits large spreadsheets and multitasking');
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'Insufficient RAM information to confidently assess.';
  }

  return {
    purpose: 'AccountingFinance',
    rating,
    explanation,
    shouldWorkWellWith: ['Excel', 'Sage', 'Xero', 'QuickBooks', 'Pastel', 'Teams', 'Zoom', 'PDFs', 'browser tabs'],
    mayStruggleWith: ['Very large Excel models with many formulas', 'Sage with very large datasets if RAM is limited'],
    bottlenecks,
    minimumRecommendedSpecs: ['8GB RAM acceptable, 16GB better', 'SSD strongly recommended', 'Good keyboard and display'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateGaming(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier, discrete: boolean | null,
  missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if (discrete && (ram === 'high' || ram === 'pro') && (cpu === 'strong' || cpu === 'pro')) {
    rating = 'StrongFit';
    explanation = 'Dedicated GPU, high RAM, and strong CPU make this suitable for AAA gaming, esports titles, and high-FPS play.';
  } else if (discrete && ram === 'mid') {
    rating = 'GoodFit';
    explanation = 'Dedicated GPU enables most gaming. Esports titles and mid-range games should run well. AAA games at high settings may need reduced quality.';
    bottlenecks.push('Mid RAM may limit background processes during gaming');
  } else if (discrete === false || discrete === null) {
    rating = 'NotIdeal';
    explanation = 'Without a dedicated GPU, AAA gaming is very limited. Esports titles and older games may run at low settings.';
    bottlenecks.push('Integrated graphics cannot run most modern AAA games at playable settings');
    bottlenecks.push('Performance depends heavily on integrated GPU quality');
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'GPU information is missing. Cannot assess gaming capability without GPU details.';
  }

  return {
    purpose: 'Gaming',
    rating,
    explanation,
    shouldWorkWellWith: discrete ? ['Steam library', 'Esports titles (Valorant, CS2, League)', 'Mid-range AAA games'] : ['Very light indie games', 'Browser-based games'],
    mayStruggleWith: discrete ? ['4K AAA gaming without very high-end GPU'] : ['AAA games', 'Most modern titles above 1080p'],
    bottlenecks,
    minimumRecommendedSpecs: ['Dedicated GPU required for gaming', '16GB RAM recommended', 'Good CPU for open-world titles', 'Cooling important for sustained performance'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateThreeDDesign(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier, discrete: boolean | null,
  missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if ((ram === 'pro' || ram === 'high') && discrete && (cpu === 'pro' || cpu === 'strong')) {
    rating = 'StrongFit';
    explanation = 'Strong RAM, dedicated GPU, and CPU make this suitable for Blender, Cinema 4D, Maya, and heavy 3D workflows.';
  } else if (discrete && ram === 'high') {
    rating = 'GoodFit';
    explanation = 'Handles moderate 3D work in Blender and Cinema 4D. Complex scenes and long renders will be slower.';
    bottlenecks.push('Render times will increase with complex 3D scenes');
  } else if (discrete && ram === 'mid') {
    rating = 'UsableWithLimits';
    explanation = 'Basic 3D modelling is possible, but rendering, complex scenes, and simulation will be very slow.';
    bottlenecks.push('Low RAM severely limits 3D scene complexity');
  } else if (!discrete) {
    rating = 'NotIdeal';
    explanation = 'Blender and 3D design tools require a dedicated GPU for practical use. GPU rendering (CUDA/OptiX) will not be available.';
    bottlenecks.push('No dedicated GPU — GPU rendering unavailable, CPU rendering only');
    bottlenecks.push('Viewport performance will be poor for complex models');
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'GPU and RAM information needed to assess 3D design suitability.';
  }

  return {
    purpose: 'ThreeDDesignBlender',
    rating,
    explanation,
    shouldWorkWellWith: discrete ? ['Blender (moderate scenes)', 'SketchUp', 'Tinkercad', 'Cinema 4D (if high-end)'] : ['Basic 3D modelling only'],
    mayStruggleWith: ['Blender GPU rendering without NVIDIA CUDA', 'Large scene polygon counts', 'Real-time ray tracing', 'SolidWorks simulation'],
    bottlenecks,
    minimumRecommendedSpecs: ['Dedicated GPU required', '16GB RAM minimum, 32GB better', 'Strong CPU for rendering', 'SSD for project files'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateHeavyMultitasking(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier,
  missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if (ram === 'pro' && (cpu === 'strong' || cpu === 'pro') && storage === 'ssd') {
    rating = 'StrongFit';
    explanation = 'Excellent for running many apps simultaneously — multiple browsers, editors, video calls, databases, and tools.';
  } else if (ram === 'high' && storage === 'ssd') {
    rating = 'GoodFit';
    explanation = 'Handles heavy multitasking well for most users. May start to slow down with very large numbers of open apps or browser tabs.';
  } else if (ram === 'mid') {
    rating = 'UsableWithLimits';
    explanation = 'Moderate multitasking is possible, but running many apps at once will cause slowdowns and potential memory pressure.';
    bottlenecks.push('8GB RAM limits how many demanding apps can run simultaneously');
  } else if (ram === 'low') {
    rating = 'NotIdeal';
    explanation = 'Heavy multitasking requires at least 16GB RAM. With less, the system will frequently use slow swap/virtual memory.';
    bottlenecks.push('Insufficient RAM for heavy multitasking');
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'RAM information is needed to assess multitasking capability.';
  }

  if (storage === 'hdd') bottlenecks.push('HDD causes significant slowdowns when RAM is under pressure');
  if (cpu === 'weak') bottlenecks.push('Weak CPU cannot sustain many parallel workloads');

  return {
    purpose: 'HeavyMultitasking',
    rating,
    explanation,
    shouldWorkWellWith: ['Multiple browser tabs', 'Teams + Zoom', 'Email + Office', 'Multiple editors'],
    mayStruggleWith: ['Many Docker containers simultaneously', 'Multiple VMs', 'Combined heavy apps + video calls'],
    bottlenecks,
    minimumRecommendedSpecs: ['16GB RAM minimum', '32GB for very heavy workloads', 'SSD required', 'Strong multi-core CPU'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateContentCreation(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier, discrete: boolean | null,
  display: DisplayTier, missing: string[], confidence: 'high' | 'medium' | 'low'
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if ((ram === 'high' || ram === 'pro') && (display === 'excellent' || display === 'good')) {
    rating = discrete ? 'StrongFit' : 'GoodFit';
    explanation = 'Good RAM and display support content creation workflows including CapCut, Canva, Lightroom, and OBS.';
  } else if (ram === 'mid') {
    rating = 'UsableWithLimits';
    explanation = 'Can run CapCut, Canva, and basic Lightroom. Heavy OBS streaming or 4K editing may struggle.';
    bottlenecks.push('Mid RAM limits simultaneous content creation tools');
  } else {
    rating = 'NotIdeal';
    explanation = 'Low RAM limits content creation tools. Basic photo editing may work, but video and streaming will struggle.';
    bottlenecks.push('Insufficient RAM for content creation');
  }

  if (display !== 'excellent' && display !== 'unknown') bottlenecks.push('Display quality affects colour accuracy for content review');
  if (storage === 'hdd') bottlenecks.push('HDD slows media file import, export, and editing');

  return {
    purpose: 'ContentCreation',
    rating,
    explanation,
    shouldWorkWellWith: ['CapCut', 'Canva', 'Lightroom (basic)', 'OBS Studio (if specs allow)', 'Photoshop (moderate)'],
    mayStruggleWith: ['4K streaming/recording', 'Heavy OBS with many sources', 'Batch Lightroom exports'],
    bottlenecks,
    minimumRecommendedSpecs: ['16GB RAM', 'Good display', 'SSD for media files', 'Dedicated GPU helpful for streaming'],
    missingInformation: missing,
    confidence,
  };
}

function evaluateOfficeWork(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier,
  missing: string[], confidence: 'high' | 'medium' | 'low',
  purpose: Purpose
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  const label = purpose === 'School' ? 'school and study' : purpose === 'OfficeAdmin' ? 'office and admin' : 'work and business';

  if (ram === 'high' || ram === 'pro') {
    rating = storage === 'ssd' ? 'StrongFit' : 'GoodFit';
    explanation = `Well suited for ${label} tasks. Handles Microsoft 365, Google Workspace, Zoom, Teams, and document work comfortably.`;
  } else if (ram === 'mid') {
    rating = storage === 'ssd' ? 'GoodFit' : 'UsableWithLimits';
    explanation = storage === 'ssd'
      ? `Suitable for ${label} use. Word, Excel, Zoom, Teams, and web browsing should work well.`
      : `Can handle ${label} tasks but HDD storage may slow startup and file loading.`;
    if (storage === 'hdd') bottlenecks.push('HDD causes slow startup and file loading');
  } else if (ram === 'low') {
    rating = 'UsableWithLimits';
    explanation = `Basic ${label} tasks are possible. Multitasking many apps or browser tabs simultaneously may be slow.`;
    bottlenecks.push('Low RAM limits multitasking');
  } else {
    rating = 'NotEnoughInformation';
    explanation = `RAM information is missing. Cannot fully assess ${label} suitability.`;
  }

  return {
    purpose,
    rating,
    explanation,
    shouldWorkWellWith: ['Microsoft 365 (Word, Excel, PowerPoint)', 'Google Workspace', 'Zoom', 'Teams', 'Outlook', 'Chrome/Edge'],
    mayStruggleWith: ['Very large spreadsheets if RAM is limited', 'Running many apps simultaneously on low-end hardware'],
    bottlenecks,
    minimumRecommendedSpecs: ['8GB RAM minimum', 'SSD recommended for speed', 'Good display and keyboard for extended use'],
    missingInformation: missing,
    confidence,
  };
}

function evaluatePersonalUse(
  ram: RAMTier, cpu: CPUTier, storage: StorageTier,
  missing: string[], confidence: 'high' | 'medium' | 'low',
  purpose: Purpose,
  specs: DeviceSpecs | null,
): PurposeFitResult {
  let rating: SuitabilityRating;
  let explanation: string;
  const bottlenecks: string[] = [];

  if (ram === 'low' || ram === 'mid' || ram === 'high' || ram === 'pro') {
    rating = ram === 'low' ? 'UsableWithLimits' : 'StrongFit';

    if (rating === 'StrongFit') {
      // Build a specific explanation using actual spec values when available
      const parts: string[] = [];
      if (specs?.cpu) {
        parts.push(`${specs.cpu} handles everyday tasks comfortably`);
      }
      if (specs?.ramGb) {
        parts.push(`${specs.ramGb}GB RAM is more than sufficient for browsing, streaming, video calls, documents, and light multitasking`);
      }
      if (specs?.storageGb && specs?.storageType) {
        const stLabel = specs.storageGb >= 1024 ? `${specs.storageGb / 1024}TB` : `${specs.storageGb}GB`;
        parts.push(`${stLabel} ${specs.storageType} provides fast storage for everyday use`);
      }
      if (specs?.gpu) {
        const gpuLower = specs.gpu.toLowerCase();
        if (/radeon graphics|iris xe|uhd|integrated/i.test(gpuLower)) {
          parts.push(`${specs.gpu} handles standard media, video streaming, and web content — not suitable for serious gaming or 3D work`);
        }
      }
      const displayNote: string[] = [];
      if (specs?.display) displayNote.push(specs.display);
      if (specs?.brightness) {
        const nitsM = specs.brightness.match(/(\d+)\s*nit/i);
        if (nitsM) {
          const nits = parseInt(nitsM[1]);
          if (nits < 300) {
            displayNote.push(`${specs.brightness} — adequate indoors, may appear dim in bright outdoor conditions`);
          } else {
            displayNote.push(specs.brightness);
          }
        }
      }
      if (displayNote.length > 0) parts.push(`Display: ${displayNote.join(', ')}`);

      explanation = parts.length > 0
        ? parts.join('. ') + '.'
        : 'Suitable for personal use including browsing, Netflix, YouTube, emails, documents, and video calls.';
    } else {
      explanation = 'Can handle browsing, YouTube, email, and basic documents, but may struggle with multiple tabs or video calls.';
      if (ram === 'low') bottlenecks.push('Low RAM may limit multiple browser tabs and simultaneous apps');
    }
  } else {
    rating = 'NotEnoughInformation';
    explanation = 'Insufficient specification information.';
  }

  if (storage === 'hdd') bottlenecks.push('HDD causes slower startup and general responsiveness');

  // "may struggle with" should reflect actual limitations — don't list RAM warnings when RAM is 16GB+
  const mayStruggleWith = ram === 'low'
    ? ['Multiple browser tabs simultaneously', 'Video calls while multitasking']
    : ['Demanding games (integrated graphics only)', 'Video editing or 3D rendering'];

  return {
    purpose,
    rating,
    explanation,
    shouldWorkWellWith: ['Browsing', 'YouTube', 'Netflix', 'Email', 'Documents', 'Social media', 'Video calls', 'Light photo editing'],
    mayStruggleWith,
    bottlenecks,
    minimumRecommendedSpecs: ['8GB RAM', 'SSD preferred for responsiveness', 'Good battery for portability'],
    missingInformation: missing,
    confidence,
  };
}
