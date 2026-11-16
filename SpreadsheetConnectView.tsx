import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FolderOpen,
  Link2,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { DriveSpreadsheetFile } from '../types/workshop';
import { extractSpreadsheetId } from '../lib/sheets';

interface SpreadsheetConnectViewProps {
  userEmail: string;
  userName: string;
  discoveredFiles: DriveSpreadsheetFile[];
  isLoadingFiles: boolean;
  error: string | null;
  onRefreshFiles: () => void;
  onSelectSpreadsheet: (spreadsheetId: string) => Promise<void>;
  onRequestCreateSpreadsheet: (workshopName: string) => void;
  onSignOut: () => void;
}

export const SpreadsheetConnectView: React.FC<SpreadsheetConnectViewProps> = ({
  userEmail,
  userName,
  discoveredFiles,
  isLoadingFiles,
  error,
  onRefreshFiles,
  onSelectSpreadsheet,
  onRequestCreateSpreadsheet,
  onSignOut,
}) => {
  const [workshopName, setWorkshopName] = useState('IronWeld Fabrication');
  const [manualInput, setManualInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(manualInput);
    if (!id) return;
    setIsConnecting(true);
    try {
      await onSelectSpreadsheet(id);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestCreateSpreadsheet(workshopName.trim() || 'IronWeld Fabrication');
  };

  return (
    <div className="min-h-screen bg-[#060E1E] text-[#EDF2FA]">
      <header className="border-b border-[#162949] bg-[#081226]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-white truncate">
              Connect Workshop Spreadsheet
            </h1>
            <p className="text-xs text-[#8DA6CA] truncate">
              Signed in as {userName || userEmail} · {userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#1E3A66] px-3.5 py-2 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Create New Workshop Sheet */}
          <form
            onSubmit={handleCreateSubmit}
            className="flex flex-col justify-between rounded-xl border border-[#1B335C] bg-[#0B172C] p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#162E57] text-[#60A5FA]">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Create New Workshop Ledger
                  </h2>
                  <p className="text-xs text-[#8DA6CA]">
                    Sets up Transactions, Inventory, Orders, and Settings tabs automatically
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-workshop-name"
                  className="mb-1.5 block text-xs font-medium text-[#B8CAE4]"
                >
                  Workshop Name
                </label>
                <input
                  id="new-workshop-name"
                  type="text"
                  required
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="e.g. IronWeld Fabrication"
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 py-2 text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-[#3B82F6]"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>Create Google Sheet in Drive</span>
            </button>
          </form>

          {/* Paste Existing Sheet Link / ID */}
          <form
            onSubmit={handleManualConnect}
            className="flex flex-col justify-between rounded-xl border border-[#1B335C] bg-[#0B172C] p-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#162E57] text-[#60A5FA]">
                  <Link2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    Connect by Sheet URL or ID
                  </h2>
                  <p className="text-xs text-[#8DA6CA]">
                    Paste an existing Google Sheets link to load it on this device
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sheet-url-input"
                  className="mb-1.5 block text-xs font-medium text-[#B8CAE4]"
                >
                  Google Sheets URL or Spreadsheet ID
                </label>
                <input
                  id="sheet-url-input"
                  type="text"
                  required
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 py-2 font-mono text-xs text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isConnecting || !manualInput.trim()}
              className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#284D85] bg-[#102242] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#17305C] disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Open Spreadsheet'}</span>
            </button>
          </form>
        </div>

        {/* Discovered Spreadsheets */}
        <section className="rounded-xl border border-[#1B335C] bg-[#0B172C]">
          <div className="flex items-center justify-between gap-4 border-b border-[#162949] px-6 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Your Workshop Spreadsheets in Google Drive
              </h2>
              <p className="text-xs text-[#8DA6CA]">
                Spreadsheets created or opened with this app appear here automatically
              </p>
            </div>
            <button
              type="button"
              onClick={onRefreshFiles}
              disabled={isLoadingFiles}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#1E3A66] px-3 py-1.5 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="flex items-center justify-center gap-3 py-12 text-sm text-[#8DA6CA]">
              <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" aria-hidden="true" />
              <span>Checking Google Drive for spreadsheets...</span>
            </div>
          ) : discoveredFiles.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[#B6C8E2]">
                No existing spreadsheets linked to this app yet.
              </p>
              <p className="mt-1 text-xs text-[#7F97BB]">
                Use &ldquo;Create Google Sheet in Drive&rdquo; above to initialize your workshop
                database in one click.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#162949]">
              {discoveredFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-[#0F1E3A] sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-[#7F97BB] truncate">
                      {file.id}
                      {file.modifiedTime
                        ? ` · Modified ${new Date(file.modifiedTime).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectSpreadsheet(file.id)}
                    className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#162E57] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB] whitespace-nowrap shrink-0"
                  >
                    <span>Open Ledger</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};
