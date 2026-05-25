'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { SerialLookupForm } from '@/components/forms/SerialLookupForm';
import { ManualDeviceForm } from '@/components/forms/ManualDeviceForm';
import type { SerialLookupResult } from '@/lib/providers/serial/SerialLookupProvider';
import type { ManualDeviceInput } from '@/lib/types/product';
import { normaliseManualInput } from '@/lib/normalisers/normaliseProduct';
import { generateUpgradeability } from '@/lib/logic/upgradeabilityEngine';
import { getMissingInformation } from '@/lib/logic/missingInformationEngine';
import { cn } from '@/lib/utils';

type Step = 'serial' | 'manual';

export default function HaveDevicePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('serial');

  function handleSerialSuccess(result: SerialLookupResult) {
    if (!result.device) return;
    // Store result for the result page (serial is already masked inside result)
    sessionStorage.setItem('compatiq_have_device', JSON.stringify({
      maskedSerial: result.maskedSerial,
      device: result.device,
      specs: result.specs,
      upgradeability: result.upgradeability.length > 0
        ? result.upgradeability
        : generateUpgradeability(result.device.category, result.specs),
      warranty: result.warranty,
      missingInformation: getMissingInformation(result.device.category, result.specs),
      sourceType: result.sourceType,
      providerStatuses: result.providerStatuses,
      savedAt: new Date().toISOString(),
    }));
    router.push('/have-device/result');
  }

  function handleManualSubmit(input: ManualDeviceInput) {
    const { device, specs } = normaliseManualInput(input);
    sessionStorage.setItem('compatiq_have_device', JSON.stringify({
      maskedSerial: null,
      device,
      specs,
      upgradeability: generateUpgradeability(input.category, specs),
      warranty: null,
      missingInformation: getMissingInformation(input.category, specs),
      sourceType: 'manual-required',
      providerStatuses: [],
      savedAt: new Date().toISOString(),
    }));
    router.push('/have-device/result');
  }

  return (
    <div className="min-h-screen bg-[#050a14] py-10 px-6">
      <div className="max-w-2xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Identify your device</h1>
            <p className="text-sm text-slate-400">Find parts, check upgradeability, and view specs for your device.</p>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit mb-6">
          <button
            type="button"
            onClick={() => setStep('serial')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              step === 'serial'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Serial number
          </button>
          <button
            type="button"
            onClick={() => setStep('manual')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              step === 'manual'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Enter manually
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 shadow-sm">
          {step === 'serial' ? (
            <SerialLookupForm
              onSuccess={handleSerialSuccess}
              onManualFallback={() => setStep('manual')}
            />
          ) : (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-800">Enter device details</h2>
              <ManualDeviceForm onSubmit={handleManualSubmit} />
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 mt-6 text-center leading-relaxed">
          CompatIQ provides advisory results based on available data. It does not guarantee compatibility or availability.
        </p>
      </div>
    </div>
  );
}
