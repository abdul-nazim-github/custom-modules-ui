'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Settings, Activity, Mail, Shield, Bell, Users, Trash2, Edit2, UserCheck, ChevronLeft, ChevronRight, LucideIcon, FileText, XCircle, Wand2 } from 'lucide-react';
import api from '@/lib/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
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

interface UserData {
    id: string;
    _id?: string;
    email: string;
    name: string;
    role: Role;
    permissions: string[];
}

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
        { id: 'users', label: 'Users', icon: Users },
        { id: 'content', label: 'Content', icon: FileText },
        { id: 'contact', label: 'Contact Form', icon: Mail, permission: Permission.CONTACT_FORM },
    ];

    const tabs = allTabs.filter((tab: { id: string; label: string; icon: LucideIcon; permission?: Permission; role?: Role }) => {
        if (tab.id === 'users') {
            return role === Role.SUPER_ADMIN ||
                permissions.includes(Permission.MANAGE_USERS) ||
                permissions.includes(Permission.MANAGE_PERMISSIONS);
        }
        if (tab.id === 'content') {
            return true; // Content tab is now visible to all users
        }
        return (tab.permission && permissions.includes(tab.permission)) ||
            (tab.role && role === tab.role);
    });
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

    // User Management State
    const [users, setUsers] = useState<UserData[]>([]);
    const [targetUserId, setTargetUserId] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role>(Role.USER);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);

    // Password Update State
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Comparison logic for disabling buttons
    const currentUser = users.find(u => (u.id || u._id) === targetUserId);
    const hasPermissionChanges = currentUser ? (
        selectedPermissions.length !== currentUser.permissions.length ||
        !selectedPermissions.every(p => currentUser.permissions.includes(p))
    ) : false;
    const hasRoleChanges = currentUser ? selectedRole !== currentUser.role : false;
    const isSelfEdit = currentUser ? currentUser.email === userEmail : false;

    // Permission flags for logged-in user
    const canManageUsers = role === Role.SUPER_ADMIN || permissions.includes(Permission.MANAGE_USERS);
    const canManagePermissions = role === Role.SUPER_ADMIN || permissions.includes(Permission.MANAGE_PERMISSIONS);
    const canDeleteUsers = role === Role.SUPER_ADMIN;

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async (page = currentPage, currentLimit = limit) => {
        setIsLoadingUsers(true);
        try {
            const response = await api.get(`/api/auth/users?page=${page}&limit=${currentLimit}`);
            if (response.data.success) {
                const fetchedUsers = response.data.data;
                setUsers(fetchedUsers);

                // Extract totalCount from meta as per the new API response format
                const total = response.data.meta?.totalCount ??
                    response.data.total ??
                    response.data.totalUsers ??
                    response.data.totalCount ??
                    response.data.count ??
                    fetchedUsers.length;

                setTotalUsers(total);
                setCurrentPage(page);
                setLimit(currentLimit);
                if (fetchedUsers.length > 0) {
                    // Update current target user data if already selected
                    if (targetUserId) {
                        const currentUser = fetchedUsers.find((u: UserData) => (u.id || u._id) === targetUserId);
                        if (currentUser) {
                            setSelectedRole(currentUser.role);
                            setSelectedPermissions(currentUser.permissions as Permission[]);
                        }
                    } else {
                        // Initial load: select first user
                        const firstUser = fetchedUsers[0];
                        const initialId = firstUser.id || firstUser._id;
                        setTargetUserId(initialId);
                        setSelectedRole(firstUser.role);
                        setSelectedPermissions(firstUser.permissions as Permission[]);
                    }
                }
            }
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Failed to fetch users');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!targetUserId || targetUserId === 'undefined') {
            toast.error('Invalid User ID selected');
            return;
        }
        if (selectedPermissions.length === 0) {
            toast.error('Please select at least one permission');
            return;
        }
        setIsUpdating(true);
        const loadingToast = toast.loading('Updating permissions...');
        try {
            await api.put(`/api/auth/users/${targetUserId}/permissions`, {
                permissions: selectedPermissions
            });
            toast.success('Permissions updated successfully!', { id: loadingToast });

            // Immediate local state update for "immediate effect"
            setUsers(prevUsers => prevUsers.map(user =>
                (user.id || user._id) === targetUserId
                    ? { ...user, permissions: [...selectedPermissions] }
                    : user
            ));

            fetchUsers(); // Still refresh list to keep in sync with server
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update permissions', { id: loadingToast });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!targetUserId || targetUserId === 'undefined') {
            toast.error('Invalid User ID selected');
            return;
        }
        setIsUpdating(true);
        const loadingToast = toast.loading('Updating role...');
        try {
            await api.put(`/api/auth/users/${targetUserId}/role`, {
                role: selectedRole
            });
            toast.success('Role updated successfully!', { id: loadingToast });

            // Immediate local state update for "immediate effect"
            setUsers(prevUsers => prevUsers.map(user =>
                (user.id || user._id) === targetUserId
                    ? { ...user, role: selectedRole }
                    : user
            ));

            fetchUsers(); // Still refresh list to keep in sync with server
        } catch (error) {
            console.error('Role update error:', error);
            toast.error('Failed to update role', { id: loadingToast });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = (userId: string, userName: string) => {
        setUserToDelete({ id: userId, name: userName });
        setShowDeleteModal(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        const loadingToast = toast.loading('Deleting user...');

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        try {
            await api.delete(`/api/auth/users/${userToDelete.id}`, {
                signal: abortControllerRef.current.signal
            });
            toast.success('User deleted successfully!', { id: loadingToast });
            if (targetUserId === userToDelete.id) {
                setTargetUserId('');
            }
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers(); // Refresh list
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                if (error.name === 'CanceledError' || error.name === 'AbortError') {
                    toast.dismiss(loadingToast);
                } else {
                    console.error('Delete user error:', error);
                    toast.error('Failed to delete user', { id: loadingToast });
                }
            } else {
                console.error('Delete user error:', error);
                toast.error('An unexpected error occurred', { id: loadingToast });
            }
        } finally {
            setIsDeleting(false);
            abortControllerRef.current = null;
        }
    };

    const togglePermission = (perm: Permission) => {
        setSelectedPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

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

    const handleUserSelect = (userId: string) => {
        setTargetUserId(userId);
        const user = users.find(u => (u.id || u._id) === userId);
        if (user) {
            setSelectedRole(user.role);
            setSelectedPermissions(user.permissions as Permission[]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-4xl overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center space-x-2 min-w-[100px] flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon size={18} />
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

                {activeTab === 'users' && (
                    <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500 font-medium">Show:</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => {
                                            const newLimit = Number(e.target.value);
                                            setLimit(newLimit);
                                            fetchUsers(1, newLimit);
                                        }}
                                        className="px-3 py-1.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 text-sm font-medium"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => fetchUsers()}
                                    disabled={isLoadingUsers}
                                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    <Activity size={18} className={isLoadingUsers ? 'animate-spin' : ''} />
                                    <span>Refresh List</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Management Section */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <Users className="mr-2 text-indigo-600" size={20} />
                                        Manage User
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">Select User</label>
                                            <select
                                                value={targetUserId}
                                                onChange={(e) => handleUserSelect(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium"
                                            >
                                                {users.length === 0 && <option value="">No users found</option>}
                                                {users.map(user => (
                                                    <option key={user.id || user._id} value={user.id || user._id || ''}>
                                                        {user.email} ({user.name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Role Update */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">Update Role</label>
                                            <div className="flex space-x-2">
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                                                    disabled={!canManageUsers || isSelfEdit}
                                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value={Role.USER}>User</option>
                                                    <option value={Role.ADMIN}>Admin</option>
                                                    <option value={Role.SUPER_ADMIN}>Super Admin</option>
                                                </select>
                                                <button
                                                    onClick={handleUpdateRole}
                                                    disabled={isUpdating || !targetUserId || !hasRoleChanges || isSelfEdit || !canManageUsers}
                                                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
                                                    title={!canManageUsers ? "You don't have permission to manage roles" : (isSelfEdit ? "You cannot update your own role" : (hasRoleChanges ? "Update Role" : "No changes to role"))}
                                                >
                                                    <UserCheck size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Permissions Update */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-2">Manage Permissions</label>
                                            <div className="grid grid-cols-1 gap-2 mb-4">
                                                {Object.values(Permission).map((perm) => (
                                                    <button
                                                        key={perm}
                                                        onClick={() => togglePermission(perm)}
                                                        disabled={!canManagePermissions || isSelfEdit}
                                                        className={`px-4 py-2 text-left text-xs font-bold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedPermissions.includes(perm)
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                            : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                            }`}
                                                    >
                                                        {PERMISSION_LABELS[perm]}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleUpdatePermissions}
                                                disabled={isUpdating || !targetUserId || !hasPermissionChanges || isSelfEdit || !canManagePermissions}
                                                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
                                                title={!canManagePermissions ? "You don't have permission to manage permissions" : (isSelfEdit ? "You cannot update your own permissions" : (hasPermissionChanges ? "Update Permissions" : "No changes to permissions"))}
                                            >
                                                {isUpdating ? (
                                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Shield size={18} />
                                                )}
                                                <span>Update Permissions</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User List Table */}
                            <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                                <div className="overflow-x-auto min-h-[580px]">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Permissions</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {isLoadingUsers && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                                                            <p className="text-gray-700 font-bold">Loading users...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {!isLoadingUsers && users.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center">
                                                        <p className="text-gray-700 font-bold">No users found.</p>
                                                    </td>
                                                </tr>
                                            )}
                                            {!isLoadingUsers && users.map((user) => (
                                                <tr key={user.id || user._id} className={targetUserId === (user.id || user._id) ? 'bg-indigo-50/50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                                                <div className="text-sm text-gray-700 font-medium">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${user.role === Role.SUPER_ADMIN ? 'bg-purple-100 text-purple-900' :
                                                            user.role === Role.ADMIN ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.permissions.slice(0, 4).map(p => (
                                                                <span key={p} className="px-2 py-0.5 bg-gray-200 text-gray-800 text-[10px] rounded-md font-bold">
                                                                    {PERMISSION_LABELS[p as Permission] || p.split('~').pop()}
                                                                </span>
                                                            ))}
                                                            {user.permissions.length > 4 && (
                                                                <div className="relative group">
                                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded-md font-bold cursor-help">
                                                                        +{user.permissions.length - 4} more
                                                                    </span>
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {user.permissions.slice(4).map(p => (
                                                                                <span key={p} className="px-1.5 py-0.5 bg-gray-700 rounded">
                                                                                    {PERMISSION_LABELS[p as Permission] || p.split('~').pop()}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleUserSelect(user.id || user._id || '')}
                                                                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                                                                title="Edit User"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id || user._id || '', user.name)}
                                                                disabled={user.email === userEmail || !canDeleteUsers}
                                                                className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                title={!canDeleteUsers ? "Only Super Admins can delete users" : (user.email === userEmail ? "You cannot delete your own account" : "Delete User")}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                {users.length > 0 && (
                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalUsers)}</span> of{' '}
                                                    <span className="font-bold">{totalUsers}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    <button
                                                        onClick={() => fetchUsers(currentPage - 1)}
                                                        disabled={currentPage === 1 || isLoadingUsers}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                                    </button>
                                                    {Array.from({ length: Math.max(1, Math.ceil(totalUsers / limit)) }).map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => fetchUsers(i + 1)}
                                                            disabled={currentPage === i + 1 || isLoadingUsers}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${currentPage === i + 1
                                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => fetchUsers(currentPage + 1)}
                                                        disabled={currentPage * limit >= totalUsers || isLoadingUsers}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                        {/* Mobile view navigation */}
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => fetchUsers(currentPage - 1)}
                                                disabled={currentPage === 1 || isLoadingUsers}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => fetchUsers(currentPage + 1)}
                                                disabled={currentPage * limit >= totalUsers || isLoadingUsers}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <ContentManagement />
                )}

                {activeTab === 'contact' && (
                    <ContactList />
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User</h3>
                            <p className="text-gray-500">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{userToDelete?.name}</span>?
                                This action cannot be undone and will permanently remove their account.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    if (isDeleting && abortControllerRef.current) {
                                        abortControllerRef.current.abort();
                                    }
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isDeleting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isDeleting ? 'Deleting...' : 'Delete User'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
