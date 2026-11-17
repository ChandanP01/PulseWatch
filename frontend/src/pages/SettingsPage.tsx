import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Lock,
  Building,
  Shield,
  Save,
  CheckCircle2,
  Sparkles,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';

// Fun stylish avatar presets for instant 1-click selection
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const SettingsPage: React.FC = () => {
  const { user, organization, updateUser } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local image file upload & convert to Data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
      toast.success('Photo ready to save! Click "Save Profile Changes".');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSavingProfile(true);
    const loadingToast = toast.loading('Saving profile updates...');

    try {
      const { data } = await api.put('/auth/profile', {
        name: name.trim(),
        avatarUrl,
      });

      updateUser({
        name: data.data.user.name,
        avatarUrl: data.data.user.avatarUrl,
      });

      toast.success('Profile updated successfully!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile', {
        id: loadingToast,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    const loadingToast = toast.loading('Updating password...');

    try {
      await api.put('/auth/profile', {
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully!', { id: loadingToast });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password', {
        id: loadingToast,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <User className="w-5 h-5 text-sky-400" />
          Account & Profile Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, avatar, security credentials, and organization preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile & Password Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Profile Information & Photo */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Personal Information</h2>
                <p className="text-xs text-slate-400">Update your public name and display avatar</p>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {user?.role}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar Selector Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Profile Photo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Current Avatar preview */}
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 shadow-xl group-hover:border-sky-500 transition-colors">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold">
                          {name ? name.slice(0, 2).toUpperCase() : 'PW'}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sky-400">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Upload button & presets */}
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      Upload New Photo
                    </button>
                    <span className="text-[11px] text-slate-400 block">
                      PNG, JPG, WebP up to 2MB
                    </span>

                    {/* Presets */}
                    <div className="pt-2">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1.5 justify-center sm:justify-start">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Or pick a quick avatar:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {AVATAR_PRESETS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                              avatarUrl === url
                                ? 'border-sky-400 scale-110 shadow-lg shadow-sky-500/25'
                                : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Email Inputs */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-slate-500 font-normal">(Primary identifier)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Submit Profile */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Password */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-5">
            <div className="pb-4 border-b border-slate-800/80">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Change Password
              </h2>
              <p className="text-xs text-slate-400">Ensure your account uses a secure password</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Organization Details Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">{organization?.name || 'Workspace'}</h3>
                <span className="text-[11px] font-mono text-slate-400">{organization?.slug}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subscription Plan</span>
                <span className="font-bold uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {organization?.plan || 'pro'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Your Organization Role</span>
                <span className="font-semibold capitalize text-slate-200">
                  {user?.role}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Check Interval Limit</span>
                <span className="font-semibold text-emerald-400">Every 30 seconds</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                RBAC Security Policy
              </div>
              <p className="leading-relaxed">
                As an <strong className="text-slate-200">{user?.role}</strong>, you have access to manage monitors, view telemetry, and configure organizational notification channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
