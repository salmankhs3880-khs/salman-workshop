import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';
import { AdminCredential } from '../types/workshop';
import { WelderLogo } from './WelderLogo';

interface AdminLoginModalProps {
  open: boolean;
  admins: AdminCredential[];
  onClose: () => void;
  onLoginSuccess: (admin: AdminCredential) => void;
  onCreateFirstAdmin: (payload: {
    adminId: string;
    password: string;
    displayName: string;
  }) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  open,
  admins,
  onClose,
  onLoginSuccess,
  onCreateFirstAdmin,
}) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('Workshop Owner');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirstTimeSetup = admins.length === 0;

  useEffect(() => {
    if (!open) return;
    setAdminId('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('Workshop Owner');
    setShowPassword(false);
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedId = adminId.trim();
    const matched = admins.find(
      (a) => a.adminId.toLowerCase() === trimmedId.toLowerCase() && a.password === password
    );
    if (!matched) {
      setError('Invalid Admin ID or Password. Please try again.');
      return;
    }
    onLoginSuccess(matched);
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedId = adminId.trim();
    if (trimmedId.length < 3) {
      setError('Admin ID must be at least 3 characters.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    onCreateFirstAdmin({
      adminId: trimmedId,
      password,
      displayName: displayName.trim() || trimmedId,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#030712]/85 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#1E3A66] bg-[#0B172C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#162949] bg-[#081226] px-5 py-4">
          <div className="flex items-center gap-3">
            <WelderLogo size={32} />
            <div>
              <h2
                id="admin-login-title"
                className="font-display text-base font-semibold text-white"
              >
                {isFirstTimeSetup ? 'Create First Admin Account' : 'Administrator Login'}
              </h2>
              <p className="text-xs text-[#8DA6CA]">
                {isFirstTimeSetup
                  ? 'Set up your Admin ID and Password to protect the overview'
                  : 'Enter your Admin ID and Password to view workshop overview'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
            aria-label="Close login modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={isFirstTimeSetup ? handleSetupSubmit : handleLoginSubmit}
          className="space-y-4 px-5 py-5 text-xs sm:px-6"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-xs text-red-200"
            >
              {error}
            </div>
          )}

          {isFirstTimeSetup && (
            <div className="rounded-lg border border-[#234375] bg-[#071021] px-3.5 py-3 text-xs text-[#B6C8E2]">
              No Admin IDs exist in your Google Sheet yet. Create your primary administrator
              account below; you can add, edit, or remove admins from the Overview menu.
            </div>
          )}

          {isFirstTimeSetup && (
            <div>
              <label
                htmlFor="setup-display-name"
                className="mb-1.5 block font-medium text-[#B8CAE4]"
              >
                Administrator Name
              </label>
              <input
                id="setup-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Workshop Owner"
                className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="admin-id-input" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Admin User ID
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B87B0]"
                aria-hidden="true"
              />
              <input
                id="admin-id-input"
                type="text"
                required
                autoComplete="username"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter Admin ID"
                className="min-h-[44px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] pr-3.5 pl-9 font-mono text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-pass-input" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B87B0]"
                aria-hidden="true"
              />
              <input
                id="admin-pass-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isFirstTimeSetup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="min-h-[44px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] pr-10 pl-9 font-mono text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-[#7E97BC] hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isFirstTimeSetup && (
            <div>
              <label
                htmlFor="admin-confirm-pass"
                className="mb-1.5 block font-medium text-[#B8CAE4]"
              >
                Confirm Password
              </label>
              <input
                id="admin-confirm-pass"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter Password"
                className="min-h-[44px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3.5 font-mono text-sm text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#162949] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] hover:bg-[#132544] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{isFirstTimeSetup ? 'Save & Open Overview' : 'Sign In to Overview'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
