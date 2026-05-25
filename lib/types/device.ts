export type DeviceCategory = 'PC' | 'Laptop' | 'Smartphone';

export type Purpose =
  | 'PersonalUse'
  | 'School'
  | 'OfficeAdmin'
  | 'WorkBusiness'
  | 'AccountingFinance'
  | 'ProgrammingCoding'
  | 'GraphicDesign'
  | 'VideoEditing'
  | 'EngineeringCAD'
  | 'ThreeDDesignBlender'
  | 'Gaming'
  | 'ContentCreation'
  | 'PhotographyMobileContent'
  | 'HeavyMultitasking';

export const PURPOSE_LABELS: Record<Purpose, string> = {
  PersonalUse: 'Personal use',
  School: 'School / student work',
  OfficeAdmin: 'Office / admin work',
  WorkBusiness: 'Work / business',
  AccountingFinance: 'Accounting / finance',
  ProgrammingCoding: 'Programming / coding',
  GraphicDesign: 'Graphic design',
  VideoEditing: 'Video editing',
  EngineeringCAD: 'Engineering / CAD',
  ThreeDDesignBlender: '3D design / Blender',
  Gaming: 'Gaming',
  ContentCreation: 'Content creation',
  PhotographyMobileContent: 'Photography / mobile content',
  HeavyMultitasking: 'Heavy multitasking',
};

export interface DeviceIdentity {
  id?: string;
  category: DeviceCategory;
  brand: string | null;
  model: string | null;
  variant?: string | null;
  deviceName: string | null;
  productNumber?: string | null;
  sourceUrl?: string | null;
  sourceProvider?: string | null;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
}

export interface DeviceSpecs {
  cpu?: string | null;
  gpu?: string | null;
  chipset?: string | null;
  ram?: string | null;
  ramGb?: number | null;
  ramType?: string | null;
  storage?: string | null;
  storageGb?: number | null;
  storageType?: string | null;
  display?: string | null;
  battery?: string | null;
  charging?: string | null;
  camera?: string | null;
  operatingSystem?: string | null;
  ports?: string | null;
  connectivity?: string | null;
  weight?: string | null;
  warranty?: string | null;
  ramSpeed?: string | null;
  brightness?: string | null;
  coolingNotes?: string | null;
  repairabilityNotes?: string | null;
  rawText?: string | null;
}
