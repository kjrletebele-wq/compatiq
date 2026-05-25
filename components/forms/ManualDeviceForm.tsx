'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { DeviceCategory } from '@/lib/types/device';
import type { ManualDeviceInput } from '@/lib/types/product';
import { cn } from '@/lib/utils';

interface ManualDeviceFormProps {
  onSubmit: (input: ManualDeviceInput) => void;
  defaultCategory?: DeviceCategory;
}

const CATEGORIES: { value: DeviceCategory; label: string }[] = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'PC', label: 'PC / Desktop' },
  { value: 'Smartphone', label: 'Smartphone' },
];

export function ManualDeviceForm({ onSubmit, defaultCategory }: ManualDeviceFormProps) {
  const [category, setCategory] = useState<DeviceCategory>(defaultCategory ?? 'Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [country, setCountry] = useState('');
  const [specsText, setSpecsText] = useState('');

  const canSubmit = !!(brand.trim() || model.trim() || deviceName.trim());

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      category,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      deviceName: deviceName.trim() || model.trim() || brand.trim() || undefined,
      price: price ? parseFloat(price) : null,
      storeName: storeName.trim() || null,
      country: country.trim() || null,
      city: null,
      specsText: specsText.trim() || null,
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 leading-relaxed">
        Enter what you know. Leave fields blank if unknown — missing information will be noted in the advisory.
      </p>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Device category</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                'py-2.5 rounded-xl border-2 text-sm font-medium transition-colors',
                category === value
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Core fields */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Brand</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Dell, Apple, Samsung"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Model / product number</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. XPS 15 9530, iPhone 16 Pro"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Device name (optional)</label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g. Dell XPS 15 9530 OLED"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Price (optional)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 15999"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Store name (optional)</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g. Takealot, Amazon"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Country (optional)</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. South Africa"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Specs text */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Paste specs text (optional)
        </label>
        <textarea
          value={specsText}
          onChange={(e) => setSpecsText(e.target.value)}
          rows={4}
          placeholder="Paste the device specifications here — e.g. from a product listing, box, or spec sheet. CompatIQ will try to extract what it can."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-800 placeholder:text-slate-400 resize-y"
        />
        {specsText && (
          <p className="text-xs text-slate-400 mt-1">
            CompatIQ will attempt to extract specs from this text. Unknown fields will be noted in the advisory.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors',
          'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
