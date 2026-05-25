import type { DeviceSpecs, DeviceCategory } from '@/lib/types/device';

interface TechnicalSpecsTableProps {
  category: DeviceCategory;
  specs: DeviceSpecs | null;
}

type SpecRow = { label: string; value: string | null | undefined };

function laptopRows(specs: DeviceSpecs): SpecRow[] {
  return [
    { label: 'CPU', value: specs.cpu },
    { label: 'GPU / Graphics', value: specs.gpu },
    { label: 'RAM', value: specs.ram ?? (specs.ramGb ? `${specs.ramGb}GB${specs.ramType ? ' ' + specs.ramType : ''}` : null) },
    { label: 'RAM type', value: specs.ramType },
    { label: 'RAM speed', value: specs.ramSpeed },
    { label: 'Storage', value: specs.storage ?? (specs.storageGb ? `${specs.storageGb}GB` : null) },
    { label: 'Storage type', value: specs.storageType },
    { label: 'Display', value: specs.display },
    { label: 'Brightness', value: specs.brightness },
    { label: 'Camera', value: specs.camera },
    { label: 'Battery', value: specs.battery },
    { label: 'Operating system', value: specs.operatingSystem },
    { label: 'Ports', value: specs.ports },
    { label: 'Connectivity', value: specs.connectivity },
    { label: 'Weight', value: specs.weight },
    { label: 'Warranty', value: specs.warranty },
    { label: 'Cooling notes', value: specs.coolingNotes },
    { label: 'Upgrade / repair notes', value: specs.repairabilityNotes },
  ];
}

function smartphoneRows(specs: DeviceSpecs): SpecRow[] {
  return [
    { label: 'Chipset', value: specs.chipset ?? specs.cpu },
    { label: 'RAM', value: specs.ram ?? (specs.ramGb ? `${specs.ramGb}GB` : null) },
    { label: 'Storage', value: specs.storage ?? (specs.storageGb ? `${specs.storageGb}GB` : null) },
    { label: 'Display', value: specs.display },
    { label: 'Battery', value: specs.battery },
    { label: 'Charging', value: specs.charging },
    { label: 'Camera', value: specs.camera },
    { label: 'Connectivity', value: specs.connectivity },
    { label: 'Operating system', value: specs.operatingSystem },
    { label: 'Weight', value: specs.weight },
    { label: 'Warranty', value: specs.warranty },
    { label: 'Repairability notes', value: specs.repairabilityNotes },
  ];
}

export function TechnicalSpecsTable({ category, specs }: TechnicalSpecsTableProps) {
  if (!specs) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-6 text-center">
        <p className="text-sm text-slate-500">No specifications available. Enter specs manually or connect a data provider.</p>
      </div>
    );
  }

  const allRows = category === 'Smartphone' ? smartphoneRows(specs) : laptopRows(specs);
  // Only show rows that have a value — omit unknown fields silently
  const knownRows = allRows.filter(r => r.value != null && r.value !== '');

  if (knownRows.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-6 text-center">
        <p className="text-sm text-slate-500">No specifications available. Enter specs manually or connect a data provider.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <tbody>
          {knownRows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="px-4 py-2.5 w-44 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-slate-800">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
