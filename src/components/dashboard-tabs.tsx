'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Settings, Activity, Mail, Shield, Bell, Users, Trash2, Edit2, UserCheck, ChevronLeft, ChevronRight, LucideIcon, FileText, XCircle, Wand2 } from 'lucide-react';
import api from '@/lib/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PermissionsManagement } from './permissions-management';
import { ContentManagement } from './content-management';
import { validatePassword, generatePassword } from '@/lib/validation';
import { PasswordChecklist } from './password-checklist';
import { ContactList } from './contact-list';
import { Input } from './ui/input';

export enum Role {
    ADMIN = 'admin',
    USER = 'user',
    SUPER_ADMIN = 'super_admin'
}

export enum Permission {
    PROFILE = 'modules~permission~profile',
    SETTINGS = 'modules~permission~settings',
    ACTIVITY = 'modules~permission~activity',
    SECURITY = 'modules~permission~security',
    MANAGE_USERS = 'modules~permission~manage_users',
    MANAGE_PERMISSIONS = 'modules~permission~manage_permissions',
    CONTACT_FORM = 'modules~permission~contact_form',
}

const PERMISSION_LABELS: Record<Permission, string> = {
    [Permission.PROFILE]: 'Profile',
    [Permission.SETTINGS]: 'Settings',
    [Permission.ACTIVITY]: 'Activity',
    [Permission.SECURITY]: 'Security',
    [Permission.MANAGE_USERS]: 'Manage Users',
    [Permission.MANAGE_PERMISSIONS]: 'Manage Permissions',
    [Permission.CONTACT_FORM]: 'Contact Form',
};



interface DashboardTabsProps {
    userName: string;
    userEmail: string;
    permissions: string[];
    role: string;
}

export function DashboardTabs({ userName, userEmail, permissions, role }: DashboardTabsProps) {
    const allTabs = [
        { id: 'profile', label: 'Profile', icon: User, permission: Permission.PROFILE },
        { id: 'settings', label: 'Settings', icon: Settings, permission: Permission.SETTINGS },
        { id: 'security', label: 'Security', icon: Shield, permission: Permission.SECURITY },
        { id: 'activity', label: 'Activity', icon: Activity, permission: Permission.ACTIVITY },
        { id: 'permissions-mgmt', label: 'Permissions Management', icon: Shield },
        { id: 'content', label: 'Content', icon: FileText },
        { id: 'contact', label: 'Contact Request Entries', icon: Mail, permission: Permission.CONTACT_FORM },
    ];

    const tabs = allTabs.filter((tab: { id: string; label: string; icon: LucideIcon; permission?: Permission; role?: Role }) => {
        if (tab.id === 'permissions-mgmt') {
            return role === Role.SUPER_ADMIN ||
                permissions.includes(Permission.MANAGE_PERMISSIONS);
        }
        if (tab.id === 'content') {
            return true;
        }
        return (tab.permission && permissions.includes(tab.permission)) ||
            (tab.role && role === tab.role);
    });
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

    // Password Update State
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);



    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }

        if (passwordData.newPassword === passwordData.oldPassword) {
            toast.error('New password cannot be the same as the old password');
            return;
        }

        const passwordError = validatePassword(passwordData.newPassword);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        setIsUpdatingPassword(true);
        const loadingToast = toast.loading('Updating password...');

        try {
            // Call the change-password endpoint which accesses httpOnly cookie
            const response = await api.post('/api/password/change', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.success) {
                toast.success('Password updated successfully!', { id: loadingToast });
                setShowPasswordForm(false);
                setPasswordData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response.data.message || 'Failed to update password', { id: loadingToast });
            }
        } catch (error: unknown) {
            console.error('Password update error:', error);
            let message = 'Failed to update password';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            toast.error(message, { id: loadingToast });
        } finally {
            setIsUpdatingPassword(false);
        }
    };



    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon size={18} className="shrink-0" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
                {activeTab === 'profile' && (
                    <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
                        <div className="flex items-center space-x-6 mb-8">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
                                <p className="text-gray-500 flex items-center mt-1">
                                    <Mail size={16} className="mr-2" />
                                    {userEmail}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status</span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Member Since</span>
                                        <span className="text-gray-900 font-medium">January 2026</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Email Notifications</p>
                                        <p className="text-sm text-gray-500">Receive updates about your account activity</p>
                                    </div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                                    <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Privacy Mode</p>
                                        <p className="text-sm text-gray-500">Hide your profile from public search</p>
                                    </div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                    <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Password</h3>
                                <p className="text-gray-500 text-sm mb-4">Keep your account secure with a strong password</p>
                                <button
                                    onClick={() => setShowPasswordForm(true)}
                                    className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Update Password
                                </button>
                            </div>
                            <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Two-Factor Auth</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 text-sm font-medium">Currently Enabled</span>
                                    <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                        <div className="space-y-8">
                            {[
                                { title: 'Logged in from new device', time: '2 hours ago', type: 'login' },
                                { title: 'Updated profile information', time: 'Yesterday', type: 'update' },
                                { title: 'Changed account password', time: '3 days ago', type: 'security' },
                            ].map((item, i) => (
                                <div key={i} className="flex space-x-4">
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Activity size={18} />
                                        </div>
                                        {i !== 2 && <div className="absolute top-10 left-5 -ml-px h-full w-0.5 bg-gray-200" />}
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {activeTab === 'permissions-mgmt' && (
                    <PermissionsManagement />
                )}



                {activeTab === 'content' && (
                    <ContentManagement />
                )}

                {activeTab === 'contact' && (
                    <ContactList />
                )}
            </div>



            {/* Password Update Modal */}
            {showPasswordForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Update Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        placeholder="Enter your current password"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        disabled={isUpdatingPassword}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="Enter your new password"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        disabled={isUpdatingPassword}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Password must be at least 8 characters with uppercase, lowercase, number, and special character
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Confirm your new password"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        disabled={isUpdatingPassword}
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                                    disabled={isUpdatingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {isUpdatingPassword && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Update Password Modal */}
            {showPasswordForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Update Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                    placeholder="Enter your current password"
                                    disabled={isUpdatingPassword}
                                />

                                <div className="space-y-2">
                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="Enter your new password"
                                        disabled={isUpdatingPassword}
                                        rightElement={
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newPass = generatePassword();
                                                    setPasswordData(prev => ({ ...prev, newPassword: newPass, confirmPassword: newPass }));
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                                title="Generate strong password"
                                            >
                                                <Wand2 size={18} />
                                            </button>
                                        }
                                    />
                                    <PasswordChecklist password={passwordData.newPassword} />
                                </div>

                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Confirm your new password"
                                    disabled={isUpdatingPassword}
                                />
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                                    disabled={isUpdatingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    {isUpdatingPassword && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
