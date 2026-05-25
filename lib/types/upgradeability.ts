export type UpgradeabilityStatus =
  | 'Upgradeable'
  | 'Replaceable'
  | 'NotUpgradeable'
  | 'Unknown';

export type ComponentType =
  | 'RAM'
  | 'SSD'
  | 'HDD'
  | 'Battery'
  | 'Screen'
  | 'Keyboard'
  | 'Speakers'
  | 'Charger'
  | 'ChargingPort'
  | 'WifiCard'
  | 'CoolingFan'
  | 'GPU'
  | 'PSU'
  | 'Motherboard'
  | 'CPU'
  | 'CPUCooler'
  | 'CaseFans'
  | 'BluetoothCard'
  | 'Monitor'
  | 'BackCover'
  | 'CameraModule'
  | 'Microphone'
  | 'SIMTray'
  | 'Case'
  | 'ScreenProtector'
  | 'Cable';

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  RAM: 'RAM',
  SSD: 'SSD / NVMe storage',
  HDD: 'Hard drive (HDD)',
  Battery: 'Battery',
  Screen: 'Screen / Display',
  Keyboard: 'Keyboard',
  Speakers: 'Speakers',
  Charger: 'Charger / power adapter',
  ChargingPort: 'Charging port',
  WifiCard: 'Wi-Fi card',
  CoolingFan: 'Cooling fan',
  GPU: 'Graphics card (GPU)',
  PSU: 'Power supply (PSU)',
  Motherboard: 'Motherboard',
  CPU: 'Processor (CPU)',
  CPUCooler: 'CPU cooler',
  CaseFans: 'Case fans',
  BluetoothCard: 'Bluetooth / Wi-Fi card',
  Monitor: 'Monitor',
  BackCover: 'Back cover / housing',
  CameraModule: 'Camera module',
  Microphone: 'Microphone',
  SIMTray: 'SIM tray',
  Case: 'Protective case',
  ScreenProtector: 'Screen protector',
  Cable: 'Cable',
};

export interface UpgradeabilityRecord {
  componentType: ComponentType;
  status: UpgradeabilityStatus;
  confidence: 'high' | 'medium' | 'low' | 'not-connected';
  explanation: string;
  sourceProvider: string | null;
  sourceUrl: string | null;
  lastCheckedAt: string;
}
