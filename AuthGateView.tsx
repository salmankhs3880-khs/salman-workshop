import React, { useState } from 'react';
import { Flame, Loader2, ShieldCheck } from 'lucide-react';
import { WelderLogo } from './WelderLogo';

interface AuthGateViewProps {
  onSignIn: () => Promise<void>;
  isLoggingIn: boolean;
  authError: string | null;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  onSignIn,
  isLoggingIn,
  authError,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#060E1E] text-[#EDF2FA] flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-[#162949] bg-[#081226]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <WelderLogo size={36} />
            <span className="font-display text-lg font-bold tracking-tight text-white">
              IronWeld Workshop
            </span>
          </div>

          <span className="hidden text-sm text-[#8DA6CA] sm:inline whitespace-nowrap shrink-0">
            Google Sheets Backed Operations
          </span>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Sign-In Panel */}
          <div className="flex flex-col justify-between rounded-xl border border-[#193055] bg-[#0B172C] p-6 sm:p-8 lg:col-span-5">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wide text-[#60A5FA]">
                Welding &amp; Metal Fabrication Management
              </p>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Run your workshop ledger directly from Google Sheets.
              </h1>
              <p className="text-sm leading-relaxed text-[#9DB4D4] sm:text-base">
                Track daily job income, raw steel and gas expenses, stock thresholds, and client
                fabrication orders across desktop, tablet, and phone with live spreadsheet storage.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                >
                  {authError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSignIn}
                  disabled={isLoggingIn}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-content-wrapper">
                    {isLoggingIn ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden="true" />
                    ) : (
                      <div className="gsi-material-button-icon">
                        <svg
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          style={{ display: 'block' }}
                        >
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          />
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                      </div>
                    )}
                    <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 border-t border-[#162949] pt-5 text-xs leading-relaxed text-[#7F97BB]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#60A5FA]" aria-hidden="true" />
              <span>
                Your financial records, inventory levels, and client orders stay inside your own
                Google Drive spreadsheet. No third-party database copies are kept.
              </span>
            </div>
          </div>

          {/* Right Workshop Visual */}
          <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-[#193055] bg-[#0B172C] lg:col-span-7">
            {!imgFailed ? (
              <img
                src="/src/assets/images/workshop_hero_welding_1794843307307.jpg"
                alt="Welding and steel fabrication workshop floor with navy steel beams and TIG welding station"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center bg-gradient-to-br from-[#0B172C] via-[#102242] to-[#060E1E] p-8 text-center">
                <Flame className="mb-3 h-10 w-10 text-[#3B82F6]" aria-hidden="true" />
                <p className="font-display text-lg font-semibold text-white">
                  IronWeld Fabrication Bay
                </p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060E1E]/90 via-[#060E1E]/25 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
              <p className="text-sm font-medium text-white">
                One live spreadsheet, synced across every bay and device
              </p>
              <p className="mt-1 text-xs text-[#B6C8E2]">
                Transactions · Material Inventory · Client Orders · Workshop Settings
              </p>
            </div>
          </div>
        </div>

        {/* 4-Column Capability Strip below hero split */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Income & Expenses',
              body: 'Log client payments, steel purchases, gas refills, consumables, and shop overhead with profit margins.',
            },
            {
              title: 'Inventory Tracking',
              body: 'Monitor mild steel plates, tubing, electrodes, Argon cylinders, and receive low-stock reorder alerts.',
            },
            {
              title: 'Client Orders',
              body: 'Track quotes, deposits, fabrication progress, due dates, and remaining customer balances.',
            },
            {
              title: 'Google Sheets Storage',
              body: 'Automatically creates or links your Google Sheet so your data is always portable and backed up.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[#162949] bg-[#0A1529] p-5"
            >
              <h2 className="font-display text-sm font-semibold text-white">{item.title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#8BA3C7]">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
