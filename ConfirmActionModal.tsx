import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { PendingConfirmation } from '../types/workshop';

interface ConfirmActionModalProps {
  pending: PendingConfirmation | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  pending,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  if (!pending) return null;

  const isDanger = pending.tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#1E3A66] bg-[#0B172C] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#182C4E] px-6 py-4">
          <div className="flex items-center gap-3">
            {isDanger ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#3B82F6]" aria-hidden="true" />
            )}
            <h3
              id="confirm-modal-title"
              className="font-display text-base font-semibold text-white"
            >
              {pending.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-[#8FA8CC] transition-colors hover:bg-[#132544] hover:text-white focus-visible:outline-2 focus-visible:outline-[#3B82F6] disabled:opacity-50"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-[#B6C8E2]">{pending.description}</p>

          {pending.details.length > 0 && (
            <div className="divide-y divide-[#182C4E] rounded-lg border border-[#182C4E] bg-[#071021]">
              {pending.details.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-xs"
                >
                  <span className="text-[#829BC0]">{item.label}</span>
                  <span className="max-w-[60%] truncate text-right font-mono font-medium text-[#E8F0FC] tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#182C4E] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-[40px] rounded-lg border border-[#1E3A66] bg-transparent px-4 py-2 text-sm font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white focus-visible:outline-2 focus-visible:outline-[#3B82F6] disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 whitespace-nowrap shrink-0 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-500'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] focus-visible:outline-[#3B82F6]'
            }`}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isSubmitting ? 'Saving to Sheet...' : pending.confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
