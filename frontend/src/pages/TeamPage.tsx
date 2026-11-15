import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, Mail, Check, X, RefreshCw } from 'lucide-react';
import { User, UserRole } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

export const TeamPage: React.FC = () => {
  const { user: currentUser, organization } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/team');
      setMembers(data.data);
    } catch (err: any) {
      console.error('Failed to load team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setTempPassword(null);

    try {
      const { data } = await api.post('/team/invite', {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });

      setTempPassword(data.data.temporaryPassword);
      setInviteName('');
      setInviteEmail('');
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetId: string, newRole: UserRole) => {
    try {
      await api.patch(`/team/${targetId}/role`, { role: newRole });
      await fetchMembers();
    } catch (err: any) {
      alert(`Failed to change role: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleRemove = async (targetId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    try {
      await api.delete(`/team/${targetId}`);
      await fetchMembers();
    } catch (err: any) {
      alert(`Failed to remove member: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const canManage = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Team Management & RBAC
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage teammates and configure role-based access control for {organization?.name}.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setIsInviteOpen(true);
              setTempPassword(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors shadow-lg shadow-sky-500/20 shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invite Teammate
          </button>
        )}
      </div>

      {/* Plan & Members Overview */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">
              {organization?.name} • <span className="uppercase text-sky-400">{organization?.plan} Plan</span>
            </div>
            <div className="text-xs text-slate-400">{members.length} active seat(s) assigned</div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-sm">Loading team roster...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px]">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{member.name}</span>
                    {member.id === currentUser?.id && (
                      <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{member.email}</td>
                  <td className="py-3.5 px-4">
                    {canManage && member.role !== 'owner' && member.id !== currentUser?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          member.role === 'owner'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : member.role === 'admin'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {member.role}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4 text-right">
                      {member.role !== 'owner' && member.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemove(member.id, member.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Remove from team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                Invite Team Member
              </h2>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
                {error}
              </div>
            )}

            {tempPassword ? (
              <div className="space-y-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Invitation Generated Successfully!
                </div>
                <p>Provide this temporary password to your team member to sign in:</p>
                <div className="p-2 bg-slate-950 rounded font-mono text-white text-sm select-all">
                  {tempPassword}
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Permissions</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="admin">Admin (Manage monitors, alerts, team)</option>
                    <option value="member">Member (Add & toggle monitors)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
