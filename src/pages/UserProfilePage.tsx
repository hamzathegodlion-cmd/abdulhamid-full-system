import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Key,
  Shield,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

// Zod Validation Schemas
const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name cannot exceed 50 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal(''))
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(60, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword']
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const UserProfilePage: React.FC = () => {
  const { user: authUser, updateUserSession } = useAuth();
  const queryClient = useQueryClient();

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success / Error status banners
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // TanStack Query: Fetch authenticated user's current profile data
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['userProfile', authUser?.id],
    queryFn: async () => {
      try {
        const res = await api.getProfile();
        return res;
      } catch {
        const meRes = await api.getMe();
        return meRes.user;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!authUser?.id
  });

  const currentUser = profileData || authUser;

  // React Hook Form for Profile Info
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { errors: profileErrors, isDirty: isProfileDirty }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: currentUser?.fullName || '',
      username: currentUser?.username || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || ''
    }
  });

  // Sync profile form when user data loads
  useEffect(() => {
    if (currentUser) {
      resetProfileForm({
        fullName: currentUser.fullName || '',
        username: currentUser.username || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      });
    }
  }, [currentUser, resetProfileForm]);

  // React Hook Form for Password Reset
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // TanStack Query Mutation: Update Profile
  const profileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      // Uses secured API route endpoint: /api/auth/profile or /api/users/profile
      const result = await api.updateProfile(values);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      
      const updatedUser = data.user || data;
      if (updatedUser) {
        updateUserSession({
          fullName: updatedUser.fullName,
          username: updatedUser.username,
          phone: updatedUser.phone,
          address: updatedUser.address
        });
      }
      setProfileErrorMsg(null);
      setProfileSuccessMsg('Your profile information has been updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setProfileSuccessMsg(null);
      setProfileErrorMsg(err.message || 'Failed to update profile details.');
    }
  });

  // TanStack Query Mutation: Reset Password
  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      return await api.changePassword(values.currentPassword, values.newPassword);
    },
    onSuccess: () => {
      setPasswordErrorMsg(null);
      setPasswordSuccessMsg('Your password was updated successfully!');
      resetPasswordForm();
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setPasswordSuccessMsg(null);
      setPasswordErrorMsg(err.message || 'Failed to update password. Please check your current password.');
    }
  });

  const onSaveProfile = (data: ProfileFormValues) => {
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    profileMutation.mutate(data);
  };

  const onResetPassword = (data: PasswordFormValues) => {
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);
    passwordMutation.mutate(data);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Account & Identity Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">User Profile Settings</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            View your current system information and securely update your personal account details or password.
          </p>
        </div>

        {currentUser?.createdAt && (
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl self-start md:self-auto">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            <span>Member since: {new Date(currentUser.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Main Profile Summary Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Shield className="w-64 h-64 text-orange-500" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            {/* Avatar Circle */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-3xl font-black text-orange-400">
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{currentUser?.fullName}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                  <Shield className="w-3 h-3 mr-1" />
                  {currentUser?.role}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Active Session
                </span>
              </div>

              <p className="text-xs font-mono text-zinc-400 mt-1">
                Username: <span className="text-zinc-200 font-semibold">@{currentUser?.username}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-400">
                {currentUser?.phone && (
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
                {currentUser?.address && (
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="truncate max-w-xs">{currentUser.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 text-xs text-zinc-400 space-y-1.5 shrink-0 w-full md:w-auto">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Security Meta</div>
            <div className="flex items-center space-x-2 font-mono text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>Last Login: {currentUser?.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Just now'}</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              ID: <code className="text-zinc-400 font-mono text-[10px]">{currentUser?.id}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Forms section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal Information Form (React Hook Form + Zod + TanStack Query) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Profile Information</h3>
                  <p className="text-xs text-zinc-400">Update your account display name, username, and contact details.</p>
                </div>
              </div>

              {isProfileLoading && (
                <div className="flex items-center text-xs text-orange-400 space-x-1.5 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            {/* Profile Success Alert Banner */}
            {profileSuccessMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-3 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Profile Error Alert Banner */}
            {profileErrorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Full Name <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...registerProfile('fullName')}
                    placeholder="e.g. Jane Doe"
                    className={`w-full bg-zinc-950 border ${
                      profileErrors.fullName ? 'border-rose-500 focus:ring-rose-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20'
                    } rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
                {profileErrors.fullName && (
                  <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{profileErrors.fullName.message}</span>
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Username <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-500 text-xs font-mono">@</span>
                  <input
                    type="text"
                    {...registerProfile('username')}
                    placeholder="username"
                    className={`w-full bg-zinc-950 border ${
                      profileErrors.username ? 'border-rose-500 focus:ring-rose-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20'
                    } rounded-xl pl-8 pr-4 py-2.5 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all`}
                  />
                </div>
                {profileErrors.username ? (
                  <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{profileErrors.username.message}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-zinc-500">Unique handle used for logging into SmartPOS.</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    {...registerProfile('phone')}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                  />
                </div>
                {profileErrors.phone && (
                  <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{profileErrors.phone.message}</span>
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Physical / Store Address
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    {...registerProfile('address')}
                    placeholder="123 Retail Lane, Suite 100, New York, NY"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all resize-none"
                  />
                </div>
                {profileErrors.address && (
                  <p className="mt-1.5 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{profileErrors.address.message}</span>
                  </p>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => resetProfileForm()}
                  disabled={!isProfileDirty || profileMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {profileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Profile Info</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Password Reset & Role Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Password Reset Form Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3 border-b border-zinc-800/80 pb-4 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Reset Account Password</h3>
                <p className="text-xs text-zinc-400">Ensure your account uses a strong, secure password.</p>
              </div>
            </div>

            {/* Password Success Alert Banner */}
            {passwordSuccessMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-3 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {/* Password Error Alert Banner */}
            {passwordErrorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit(onResetPassword)} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Current Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...registerPassword('currentPassword')}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border ${
                      passwordErrors.currentPassword ? 'border-rose-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20'
                    } rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{passwordErrors.currentPassword.message}</span>
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  New Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerPassword('newPassword')}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border ${
                      passwordErrors.newPassword ? 'border-rose-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20'
                    } rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{passwordErrors.newPassword.message}</span>
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Confirm New Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerPassword('confirmPassword')}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border ${
                      passwordErrors.confirmPassword ? 'border-rose-500' : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20'
                    } rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{passwordErrors.confirmPassword.message}</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Role & Privileges Information Box */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Role Permissions & Security Scope</span>
            </div>

            {currentUser?.role === UserRole.MANAGER ? (
              <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                <p>
                  As a <strong className="text-orange-400 font-semibold">Store Manager</strong>, you hold full operational access to the system:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 pl-1">
                  <li>Manage product catalog, prices, and barcodes</li>
                  <li>Perform stock adjustments, stock-ins, and damage logs</li>
                  <li>Manage cashier accounts and reset staff credentials</li>
                  <li>View sales reports, financial metrics, and audit logs</li>
                </ul>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                <p>
                  As a <strong className="text-orange-400 font-semibold">Cashier Staff Member</strong>, your account has front-counter sales privileges:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 pl-1">
                  <li>Process checkout sales and issue customer receipts</li>
                  <li>Look up product prices and search inventory stock</li>
                  <li>View your personal daily sales transactions history</li>
                  <li>Update your personal user profile and account password</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
