import type { DeviceCategory, DeviceSpecs } from '@/lib/types/device';
import type { UpgradeabilityRecord, ComponentType } from '@/lib/types/upgradeability';

const NOW = () => new Date().toISOString();

function makeRecord(
  componentType: ComponentType,
  status: UpgradeabilityRecord['status'],
  confidence: UpgradeabilityRecord['confidence'],
  explanation: string
): UpgradeabilityRecord {
  return {
    componentType,
    status,
    confidence,
    explanation,
    sourceProvider: null,
    sourceUrl: null,
    lastCheckedAt: NOW(),
  };
}

export function generateUpgradeability(
  category: DeviceCategory,
  specs: DeviceSpecs | null
): UpgradeabilityRecord[] {
  switch (category) {
    case 'Smartphone':
      return generateSmartphoneUpgradeability(specs);
    case 'Laptop':
      return generateLaptopUpgradeability(specs);
    case 'PC':
      return generatePCUpgradeability(specs);
  }
}

function generateSmartphoneUpgradeability(specs: DeviceSpecs | null): UpgradeabilityRecord[] {
  const notes = (specs?.repairabilityNotes ?? '').toLowerCase();
  const storageNote = notes.includes('microsd') ? 'expandable' : 'internal-only';

  return [
    makeRecord('RAM', 'NotUpgradeable', 'high',
      'Smartphone RAM is soldered to the motherboard. It cannot be upgraded.'),
    makeRecord('SSD', storageNote === 'expandable' ? 'Upgradeable' : 'NotUpgradeable',
      storageNote === 'expandable' ? 'high' : 'high',
      storageNote === 'expandable'
        ? 'This device supports microSD storage expansion.'
        : 'Internal storage is soldered and cannot be upgraded. No microSD support confirmed.'),
    makeRecord('Battery', 'Replaceable', 'medium',
      'Battery replacement is possible but typically requires a technician. Use OEM or quality third-party parts.'),
    makeRecord('Screen', 'Replaceable', 'medium',
      'Screen replacement is possible through authorised service centres. Costs and difficulty vary by model.'),
    makeRecord('ChargingPort', 'Replaceable', 'medium',
      'Charging port replacement is possible through a technician. Confirm port type with repair centre.'),
    makeRecord('BackCover', 'Replaceable', 'medium',
      'Back cover can be replaced by a technician. Availability depends on model.'),
    makeRecord('CameraModule', 'Replaceable', 'low',
      'Camera module replacement is technically possible but may affect software calibration.'),
    makeRecord('Speakers', 'Replaceable', 'low',
      'Speaker replacement requires disassembly and is typically done at service centres.'),
    makeRecord('Microphone', 'Replaceable', 'low',
      'Microphone replacement is possible but requires technician-level disassembly.'),
    makeRecord('SIMTray', 'Replaceable', 'high',
      'SIM tray replacement is simple and low-cost.'),
    makeRecord('Case', 'Replaceable', 'high',
      'Protective cases are accessories and can be replaced freely. Check model compatibility.'),
    makeRecord('ScreenProtector', 'Replaceable', 'high',
      'Screen protectors are accessories and can be replaced freely. Confirm model dimensions.'),
    makeRecord('Charger', 'Replaceable', 'high',
      'Charger/cable replacement is straightforward. Confirm wattage and connector type for this model.'),
  ];
}

function generateLaptopUpgradeability(specs: DeviceSpecs | null): UpgradeabilityRecord[] {
  const notes = (specs?.repairabilityNotes ?? '').toLowerCase();
  const ramSoldered = notes.includes('soldered ram') || notes.includes('ram soldered') || notes.includes('soldered memory');
  const ssdUpgradeable = notes.includes('ssd upgradeable') || notes.includes('m.2');
  const ssdSoldered = notes.includes('soldered ssd');

  return [
    ramSoldered
      ? makeRecord('RAM', 'NotUpgradeable', 'high',
          'RAM is soldered to the motherboard and cannot be upgraded.')
      : makeRecord('RAM', 'Unknown', 'low',
          'It is not confirmed whether RAM is soldered or upgradeable for this exact model. Check the manufacturer service manual or iFixit before purchasing.'),

    ssdSoldered
      ? makeRecord('SSD', 'NotUpgradeable', 'high',
          'SSD is soldered and cannot be upgraded.')
      : ssdUpgradeable
        ? makeRecord('SSD', 'Upgradeable', 'high',
            'SSD can be upgraded. Confirm slot type (M.2 PCIe/SATA) and maximum supported capacity before purchasing.')
        : makeRecord('SSD', 'Unknown', 'low',
            'SSD upgradeability is not confirmed for this model. Verify with manufacturer or iFixit before purchasing.'),

    makeRecord('Battery', 'Replaceable', 'medium',
      'Laptop batteries can typically be replaced, but often require a technician. Connector type and wattage must match exactly.'),

    makeRecord('Screen', 'Replaceable', 'medium',
      'Screen replacement is possible through service centres. Panel type and exact model must match.'),

    makeRecord('Keyboard', 'Replaceable', 'medium',
      'Keyboard replacement difficulty varies by manufacturer. Some laptops have user-accessible keyboards; others require full disassembly.'),

    makeRecord('Charger', 'Replaceable', 'high',
      'Charger can be replaced. Confirm wattage, connector type (USB-C or barrel), and charging protocol for this model.'),

    makeRecord('Speakers', 'Replaceable', 'low',
      'Speaker replacement typically requires significant disassembly. Service centre recommended.'),

    makeRecord('CoolingFan', 'Replaceable', 'medium',
      'Cooling fans can be replaced but require disassembly. Use OEM or exact-spec replacements.'),

    makeRecord('WifiCard', 'Unknown', 'low',
      'Wi-Fi card upgradeability depends on whether it uses an M.2 or soldered chip. Confirm with service manual.'),

    makeRecord('ChargingPort', 'Replaceable', 'low',
      'Charging port replacement is possible but requires advanced disassembly. Service centre recommended.'),
  ];
}

function generatePCUpgradeability(specs: DeviceSpecs | null): UpgradeabilityRecord[] {
  const notes = (specs?.repairabilityNotes ?? '').toLowerCase();
  const knownMotherboard = notes.includes('motherboard');
  const knownPSU = notes.includes('psu') || notes.includes('power supply');

  return [
    makeRecord('RAM', knownMotherboard ? 'Upgradeable' : 'Unknown', knownMotherboard ? 'medium' : 'low',
      knownMotherboard
        ? 'RAM can be upgraded. Confirm supported type (DDR4/DDR5), speed, and maximum capacity for this motherboard.'
        : 'RAM upgradeability likely, but confirm motherboard slot availability, type, and maximum capacity first.'),

    makeRecord('SSD', 'Upgradeable', 'medium',
      'SSD/HDD upgrades are generally possible in desktop PCs. Confirm available slots and supported interface (SATA/NVMe/M.2).'),

    makeRecord('GPU', knownPSU ? 'Upgradeable' : 'Unknown', 'low',
      knownPSU
        ? 'GPU upgrade is possible. Confirm PSU wattage, PCIe slot availability, and case clearance.'
        : 'GPU upgradeability depends on PSU wattage, case size, and motherboard PCIe slots. Confirm these before purchasing a GPU.'),

    makeRecord('PSU', 'Replaceable', 'medium',
      'PSU can be replaced. Confirm form factor (ATX/SFX), wattage, and connectors required by current components.'),

    makeRecord('CPU', 'Unknown', 'low',
      'CPU upgradeability depends on motherboard socket compatibility and chipset support. Verify before purchasing a CPU.'),

    makeRecord('CPUCooler', 'Replaceable', 'medium',
      'CPU cooler can be replaced. Confirm socket compatibility and TDP rating.'),

    makeRecord('CaseFans', 'Replaceable', 'high',
      'Case fans can be replaced easily. Confirm size (120mm/140mm) and connector type.'),

    makeRecord('Motherboard', 'Replaceable', 'low',
      'Motherboard replacement is technically possible but requires full disassembly and component compatibility checks. Professional recommended.'),

    makeRecord('BluetoothCard', 'Unknown', 'low',
      'Depends on whether the current card uses M.2 or is soldered. Verify with motherboard specification.'),

    makeRecord('Monitor', 'Replaceable', 'high',
      'Monitor can be replaced freely. Confirm display output ports available on the system.'),
  ];
}
