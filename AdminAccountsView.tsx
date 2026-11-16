import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Pencil, Plus, Shield, Trash2, X } from 'lucide-react';
import { AdminCredential } from '../types/workshop';
import { generateId, getTodayISO } from '../lib/format';

interface AdminAccountsViewProps {
  admins: AdminCredential[];
  currentAdminId: string;
  onAddAdmin: (data: Omit<AdminCredential, 'rowIndex'>) => void;
  onUpdateAdmin: (data: Omit<AdminCredential, 'rowIndex'>, rowIndex: number) => void;
  onDeleteAdmin: (admin: AdminCredential) => void;
}

export const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  admins,
  currentAdminId,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminCredential | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Form fields
  const [adminId, setAdminId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Manager');
  const [password, setPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingAdmin(null);
    setAdminId('');
    setDisplayName('');
    setRole('Manager');
    setPassword('');
    setShowFormPassword(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (admin: AdminCredential) => {
    setEditingAdmin(admin);
    setAdminId(admin.adminId);
    setDisplayName(admin.displayName);
    setRole(admin.role || 'Admin');
    setPassword(admin.password);
    setShowFormPassword(false);
    setFormError(null);
    setModalOpen(true);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedId = adminId.trim();
    if (trimmedId.length < 3) {
      setFormError('Admin User ID must be at least 3 characters.');
      return;
    }
    if (password.length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }
    const duplicate = admins.find(
      (a) =>
        a.adminId.toLowerCase() === trimmedId.toLowerCase() &&
        a.id !== editingAdmin?.id
    );
    if (duplicate) {
      setFormError(`Admin ID "${trimmedId}" already exists.`);
      return;
    }

    const payload: Omit<AdminCredential, 'rowIndex'> = {
      id: editingAdmin?.id || generateId('ADM'),
      adminId: trimmedId,
      password,
      displayName: displayName.trim() || trimmedId,
      role: role.trim() || 'Admin',
      createdAt: editingAdmin?.createdAt || getTodayISO(),
    };

    setModalOpen(false);
    if (editingAdmin) {
      onUpdateAdmin(payload, editingAdmin.rowIndex);
    } else {
      onAddAdmin(payload);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Administrator IDs &amp; Passwords
          </h2>
          <p className="mt-0.5 text-xs text-[#8DA6CA]">
            Only authenticated administrators can add, edit, change passwords, or remove access.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Add Admin ID</span>
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#193055] bg-[#0B172C]">
        {admins.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-white">No Admin accounts stored yet</p>
            <p className="mt-1 text-xs text-[#8DA6CA]">
              Add an Admin ID and Password so only authorized managers can view the overview.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Create Admin Account</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#162949] bg-[#081224] text-[#8DA6CA]">
                    <th className="px-4 py-3 font-medium">Admin User ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Password</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152847]">
                  {admins.map((admin) => {
                    const isSelf =
                      admin.adminId.toLowerCase() === currentAdminId.toLowerCase();
                    const revealed = Boolean(revealedIds[admin.id]);
                    return (
                      <tr key={admin.id} className="transition-colors hover:bg-[#0F1E3A]">
                        <td className="px-4 py-3 font-mono font-semibold text-[#60A5FA] whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                            {admin.adminId}
                            {isSelf && (
                              <span className="text-[11px] font-sans font-normal text-emerald-400">
                                (Signed in)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {admin.displayName}
                        </td>
                        <td className="px-4 py-3 text-[#C5D5EC]">{admin.role}</td>
                        <td className="px-4 py-3 font-mono text-[#D6E4F8]">
                          <div className="inline-flex items-center gap-2">
                            <span>{revealed ? admin.password : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => toggleReveal(admin.id)}
                              aria-label={revealed ? 'Hide password' : 'Show password'}
                              className="rounded p-1 text-[#7E97BC] hover:bg-[#17305C] hover:text-white"
                            >
                              {revealed ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#8DA6CA] tabular-nums">
                          {admin.createdAt || '—'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(admin)}
                              className="inline-flex items-center gap-1 rounded-md border border-[#1E3A66] px-2.5 py-1 text-[11px] font-medium text-[#C5D5EC] hover:bg-[#17305C] hover:text-white"
                            >
                              <Pencil className="h-3 w-3" aria-hidden="true" />
                              <span>Edit / Change</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAdmin(admin)}
                              disabled={admins.length <= 1}
                              title={
                                admins.length <= 1
                                  ? 'Cannot remove the last remaining admin account'
                                  : `Remove ${admin.adminId}`
                              }
                              aria-label={`Remove admin ${admin.adminId}`}
                              className="rounded-md p-1.5 text-[#8FA8CC] hover:bg-red-950/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-[#162949] md:hidden">
              {admins.map((admin) => {
                const revealed = Boolean(revealedIds[admin.id]);
                const isSelf =
                  admin.adminId.toLowerCase() === currentAdminId.toLowerCase();
                return (
                  <div key={admin.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-[#60A5FA]">
                          {admin.adminId}{' '}
                          {isSelf && (
                            <span className="font-sans text-xs font-normal text-emerald-400">
                              · Active
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white">
                          {admin.displayName} · {admin.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleReveal(admin.id)}
                        className="min-h-[36px] rounded-md border border-[#1E3A66] px-2.5 font-mono text-xs text-[#C5D5EC]"
                      >
                        {revealed ? admin.password : 'Show Pass'}
                      </button>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(admin)}
                        className="min-h-[36px] rounded-md border border-[#1E3A66] px-3 text-xs text-[#C5D5EC]"
                      >
                        Edit / Change
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAdmin(admin)}
                        disabled={admins.length <= 1}
                        className="min-h-[36px] rounded-md border border-red-900/60 px-3 text-xs text-red-300 disabled:opacity-35"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Admin Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="adm-form-title"
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-xl border border-[#1E3A66] bg-[#0B172C] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#162949] px-6 py-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#60A5FA]" aria-hidden="true" />
                <h3 id="adm-form-title" className="font-display text-base font-semibold text-white">
                  {editingAdmin ? `Edit Admin (${editingAdmin.adminId})` : 'Add New Admin Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 text-xs">
              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-red-200"
                >
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="adm-id" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Admin User ID
                </label>
                <input
                  id="adm-id"
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="e.g. boss01"
                  className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="adm-name" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Display Name
                  </label>
                  <input
                    id="adm-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Salman"
                    className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="adm-role" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Role
                  </label>
                  <select
                    id="adm-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="adm-pass" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="adm-pass"
                    type={showFormPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new or updated password"
                    className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] pr-10 pl-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword((prev) => !prev)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[#7E97BC] hover:text-white"
                    aria-label={showFormPassword ? 'Hide password' : 'Show password'}
                  >
                    {showFormPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#162949] px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[40px] rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] hover:bg-[#132544] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[40px] rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {editingAdmin ? 'Review Changes' : 'Review & Add Admin'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
