import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Save, Shuffle } from 'lucide-react';
import { CURRENCY_OPTIONS, SpreadsheetInfo, WorkshopSettings } from '../types/workshop';

interface SettingsViewProps {
  spreadsheet: SpreadsheetInfo;
  settings: WorkshopSettings;
  missingTabs: string[];
  onSaveSettings: (updated: WorkshopSettings) => void;
  onInitializeMissingTabs: () => void;
  onSwitchSpreadsheet: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  spreadsheet,
  settings,
  missingTabs,
  onSaveSettings,
  onInitializeMissingTabs,
  onSwitchSpreadsheet,
  onSyncNow,
  isSyncing,
}) => {
  const [form, setForm] = useState<WorkshopSettings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      workshopName: form.workshopName.trim() || 'IronWeld Fabrication',
      currency: form.currency || 'USD',
      ownerPhone: form.ownerPhone.trim(),
      shopAddress: form.shopAddress.trim(),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Workshop Profile & Currency */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-[#193055] bg-[#0B172C] p-6 lg:col-span-7"
      >
        <div className="border-b border-[#162949] pb-4">
          <h2 className="font-display text-base font-semibold text-white">
            Workshop Profile &amp; Currency
          </h2>
          <p className="mt-0.5 text-xs text-[#8DA6CA]">
            Saved in the Settings tab of your connected Google Sheet
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="ws-name"
              className="mb-1.5 block text-xs font-medium text-[#B8CAE4]"
            >
              Workshop Name
            </label>
            <input
              id="ws-name"
              type="text"
              required
              value={form.workshopName}
              onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
              className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="ws-currency"
              className="mb-1.5 block text-xs font-medium text-[#B8CAE4]"
            >
              Display Currency
            </label>
            <select
              id="ws-currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ws-phone"
              className="mb-1.5 block text-xs font-medium text-[#B8CAE4]"
            >
              Workshop Phone
            </label>
            <input
              id="ws-phone"
              type="text"
              value={form.ownerPhone}
              onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
              placeholder="+1 (555) 234-5678"
              className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="ws-address"
              className="mb-1.5 block text-xs font-medium text-[#B8CAE4]"
            >
              Shop Location / Yard Address
            </label>
            <input
              id="ws-address"
              type="text"
              value={form.shopAddress}
              onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
              placeholder="Industrial Bay 4, Steelworks Road"
              className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-[#162949] pt-4">
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Save Workshop Settings</span>
          </button>
        </div>
      </form>

      {/* Connected Google Sheet Card */}
      <div className="space-y-5 rounded-xl border border-[#193055] bg-[#0B172C] p-6 lg:col-span-5">
        <div className="border-b border-[#162949] pb-4">
          <h2 className="font-display text-base font-semibold text-white">
            Connected Google Sheet
          </h2>
          <p className="mt-0.5 text-xs text-[#8DA6CA]">
            Live spreadsheet storage details
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-[#162949] bg-[#071021] p-4 text-xs">
          <div>
            <p className="text-[#7E97BC]">Spreadsheet Title</p>
            <p className="mt-0.5 font-medium text-white">{spreadsheet.title}</p>
          </div>
          <div>
            <p className="text-[#7E97BC]">Spreadsheet ID</p>
            <p className="mt-0.5 break-all font-mono text-[11px] text-[#B6C8E2]">
              {spreadsheet.spreadsheetId}
            </p>
          </div>
          <div>
            <p className="text-[#7E97BC]">Detected Tabs</p>
            <p className="mt-0.5 text-[#D6E4F8]">
              {spreadsheet.sheets.map((s) => s.title).join(' · ')}
            </p>
          </div>
        </div>

        {missingTabs.length > 0 && (
          <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-xs">
            <p className="font-medium text-amber-200">
              Missing required tabs: {missingTabs.join(', ')}
            </p>
            <button
              type="button"
              onClick={onInitializeMissingTabs}
              className="min-h-[38px] rounded-lg bg-amber-600 px-3.5 py-1.5 font-semibold text-white hover:bg-amber-500"
            >
              Create Missing Tabs in Sheet
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <a
            href={spreadsheet.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#234375] bg-[#102242] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#17305C]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Open in Google Sheets</span>
          </a>

          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isSyncing ? 'Syncing...' : 'Reload Data from Sheet'}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchSpreadsheet}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Switch or Create Another Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
