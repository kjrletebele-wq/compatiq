'use client';

import { useState } from 'react';
import { Search, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BuyDeviceLinkForm } from '@/components/forms/BuyDeviceLinkForm';
import { ManualDeviceForm } from '@/components/forms/ManualDeviceForm';
import { PurposeSelector } from '@/components/forms/PurposeSelector';
import type { ProductLinkResult } from '@/lib/types/product';
import type { DeviceIdentity, DeviceSpecs, Purpose } from '@/lib/types/device';
import { normaliseManualInput } from '@/lib/normalisers/normaliseProduct';
import type { ManualDeviceInput } from '@/lib/types/product';
import { cn } from '@/lib/utils';

type Step = 'link' | 'manual' | 'purpose';

export default function BuyDevicePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('link');
  const [device, setDevice] = useState<DeviceIdentity | null>(null);
  const [specs, setSpecs] = useState<DeviceSpecs | null>(null);
  const [storeListing, setStoreListing] = useState<ProductLinkResult['storeListing']>(null);
  const [generatingAdvisory, setGeneratingAdvisory] = useState(false);

  function handleLinkSuccess(result: ProductLinkResult) {
    if (result.device) setDevice(result.device);
    if (result.specs) setSpecs(result.specs);
    if (result.storeListing) setStoreListing(result.storeListing);
    setStep('purpose');
  }

  function handleManualSubmit(input: ManualDeviceInput) {
    const { device: d, specs: s } = normaliseManualInput(input);
    setDevice(d);
    setSpecs(s);
    if (input.price || input.storeName) {
      setStoreListing({
        id: 'manual',
        productName: d.deviceName ?? d.model ?? '',
        storeName: input.storeName ?? 'Unknown store',
        price: input.price ?? null,
        currency: input.currency ?? null,
        availability: null,
        country: input.country ?? null,
        city: input.city ?? null,
        productUrl: '',
        matchConfidence: 'unknown',
        sourceProvider: 'manual',
        lastCheckedAt: new Date().toISOString(),
      });
    }
    setStep('purpose');
  }

  async function handlePurposeSubmit(purpose: Purpose) {
    if (!device) return;
    setGeneratingAdvisory(true);
    try {
      const res = await fetch('/api/device/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, specs, purpose }),
      });
      const advisoryResult = await res.json();

      // Store result in sessionStorage for the report page (no sensitive data)
      sessionStorage.setItem('compatiq_report', JSON.stringify({
        device,
        specs,
        storeListing,
        purpose,
        advisory: advisoryResult,
        generatedAt: new Date().toISOString(),
      }));

      router.push('/buy-device/report');
    } catch {
      setGeneratingAdvisory(false);
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'link', label: 'Device' },
    { id: 'purpose', label: 'Purpose' },
  ];

  const activeStepIndex = step === 'manual' ? 0 : step === 'link' ? 0 : 1;

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
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Check a device before you buy</h1>
            <p className="text-sm text-slate-400">Paste a link or enter details to get a full advisory.</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                i === activeStepIndex
                  ? 'bg-sky-500 text-white'
                  : i < activeStepIndex
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-slate-800 text-slate-400'
              )}>
                {s.label}
              </span>
              {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
            </div>
          ))}
        </div>

        {/* White card container */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 shadow-sm">

          {/* STEP 1: Link */}
          {step === 'link' && (
            <div className="space-y-6">
              <BuyDeviceLinkForm
                onSuccess={handleLinkSuccess}
                onManualFallback={() => setStep('manual')}
              />
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Prefer to enter details manually?</p>
                <button
                  type="button"
                  onClick={() => setStep('manual')}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium underline underline-offset-2"
                >
                  Enter device details manually
                </button>
              </div>
            </div>
          )}

          {/* STEP 1B: Manual fallback */}
          {step === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">Enter device details</h2>
                <button
                  type="button"
                  onClick={() => setStep('link')}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  ← Back to link input
                </button>
              </div>
              <ManualDeviceForm onSubmit={handleManualSubmit} />
            </div>
          )}

          {/* STEP 2: Purpose */}
          {step === 'purpose' && (
            <div className="space-y-4">
              {device && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 mb-2">
                  <p className="text-xs text-slate-500 mb-0.5">Device selected</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {device.deviceName ?? device.model ?? 'Unknown device'}
                  </p>
                  {device.brand && <p className="text-xs text-slate-500">{device.brand} · {device.category}</p>}
                  <button
                    type="button"
                    onClick={() => setStep('link')}
                    className="text-xs text-sky-600 hover:text-sky-700 underline mt-1"
                  >
                    Change device
                  </button>
                </div>
              )}
              <PurposeSelector onSubmit={handlePurposeSubmit} loading={generatingAdvisory} />
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
