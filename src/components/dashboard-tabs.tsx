'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Settings, Activity, Mail, Shield, Bell, Users, Trash2, Edit2, UserCheck, ChevronLeft, ChevronRight, LucideIcon, FileText, XCircle, Wand2, Eye } from 'lucide-react';
import api from '@/lib/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PermissionsManagement } from './permissions-management';
import { validatePassword, generatePassword } from '@/lib/validation';
import { PasswordChecklist } from './password-checklist';
import { ContactList } from './contact-list';
import { ContentManagement } from './content-management';
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
    CMS = 'modules~permission~cms',
}

const PERMISSION_LABELS: Record<Permission, string> = {
    [Permission.PROFILE]: 'Profile',
    [Permission.SETTINGS]: 'Settings',
    [Permission.ACTIVITY]: 'Activity',
    [Permission.SECURITY]: 'Security',
    [Permission.MANAGE_USERS]: 'Manage Users',
    [Permission.MANAGE_PERMISSIONS]: 'Manage Permissions',
    [Permission.CONTACT_FORM]: 'Contact Form',
    [Permission.CMS]: 'CMS',
};

interface UserData {
    id: string;
    _id?: string;
    email: string;
    name: string;
    role: Role;
    permissions: string[];
    custom_permissions?: string[];
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
        { id: 'cms', label: 'CMS', icon: FileText, permission: Permission.CMS },
        { id: 'permissions-mgmt', label: 'Permissions Management', icon: Shield },
        { id: 'contact', label: 'Contact Request Entries', icon: Mail, permission: Permission.CONTACT_FORM },
    ];

    const tabs = allTabs.filter((tab: { id: string; label: string; icon: LucideIcon; permission?: Permission; role?: Role }) => {
        if (tab.id === 'permissions-mgmt') {
            return role === Role.SUPER_ADMIN ||
                permissions.includes(Permission.MANAGE_PERMISSIONS);
        }
        if (tab.id === 'users') {
            return role === Role.SUPER_ADMIN ||
                permissions.includes(Permission.MANAGE_USERS) ||
                permissions.includes(Permission.MANAGE_PERMISSIONS);
        }
        if (tab.id === 'cms' || tab.id === 'contact') {
            return role === Role.SUPER_ADMIN || (tab.permission && permissions.includes(tab.permission));
        }
        return (tab.permission && permissions.includes(tab.permission)) ||
            (tab.role && role === tab.role);
    });
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

    // User Management State
    const [users, setUsers] = useState<UserData[]>([]);
    const [targetUserId, setTargetUserId] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [sortBy, setSortBy] = useState<string>('name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    // Edit User State
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<{ id: string, name: string, email: string } | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '' });
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);

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

    const getUserPermissions = (user: UserData): string[] => {
        return user.custom_permissions || user.permissions || [];
    };

    const fetchUsers = async (page = currentPage, currentLimit = limit) => {
        setIsLoadingUsers(true);
        try {
            const response = await api.get('/api/auth/users', {
                params: {
                    page,
                    limit: currentLimit,
                    sortBy,
                    order
                }
            });
            if (response.data.success) {
                const fetchedUsers = response.data.users || response.data.data || [];
                setUsers(fetchedUsers);
                setTotalUsers(response.data.total || response.data.meta?.totalCount || fetchedUsers.length);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, currentPage, limit, sortBy, order]);

    const handleEditClick = (user: UserData) => {
        setEditingUser({ id: user.id || user._id || '', name: user.name, email: user.email });
        setEditFormData({ name: user.name });
        setShowEditUserModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        if (!editFormData.name) {
            toast.error('Name is required');
            return;
        }

        setIsUpdatingUser(true);
        const loadingToast = toast.loading('Updating user...');

        try {
            await api.put(`/api/auth/users/${editingUser.id}`, {
                name: editFormData.name
            });
            toast.success('User updated successfully!', { id: loadingToast });
            setShowEditUserModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Update user error:', error);
            toast.error('Failed to update user', { id: loadingToast });
        } finally {
            setIsUpdatingUser(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: Role) => {
        const loadingToast = toast.loading('Updating role...');
        try {
            await api.put(`/api/auth/users/${userId}/role`, { role: newRole });
            toast.success('Role updated successfully', { id: loadingToast });
            fetchUsers();
        } catch (error) {
            console.error('Role update error:', error);
            toast.error('Failed to update role', { id: loadingToast });
        }
    };

    const handleUpdatePermissions = async (userId: string, perms: string[]) => {
        const loadingToast = toast.loading('Updating permissions...');
        try {
            await api.put(`/api/auth/users/${userId}/permissions`, { permissions: perms });
            toast.success('Permissions updated successfully', { id: loadingToast });
            fetchUsers();
        } catch (error) {
            console.error('Permissions update error:', error);
            toast.error('Failed to update permissions', { id: loadingToast });
        }
    };

    const togglePermission = (userId: string, perm: string, currentPerms: string[]) => {
        const newPerms = currentPerms.includes(perm)
            ? currentPerms.filter(p => p !== perm)
            : [...currentPerms, perm];
        handleUpdatePermissions(userId, newPerms);
    };

    const handleDeleteUser = (id: string, name: string) => {
        setUserToDelete({ id, name });
        setShowDeleteModal(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        abortControllerRef.current = new AbortController();

        try {
            const response = await api.delete(`/api/auth/users/${userToDelete.id}`, {
                signal: abortControllerRef.current.signal
            });

            if (response.data.success) {
                toast.success(`User ${userToDelete.name} deleted successfully`);
                setShowDeleteModal(false);
                setUserToDelete(null);
                fetchUsers(users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage);
            }
        } catch (error: any) {
            if (error.name === 'CanceledError') return;
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
            abortControllerRef.current = null;
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

                        <div className="space-y-6">
                            {/* User List Table */}
                            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                                <div className="overflow-x-auto min-h-[580px]">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th
                                                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => {
                                                        const newOrder = sortBy === 'name' && order === 'asc' ? 'desc' : 'asc';
                                                        setSortBy('name');
                                                        setOrder(newOrder);
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Name</span>
                                                        {sortBy === 'name' && (
                                                            <span>{order === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th
                                                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => {
                                                        const newOrder = sortBy === 'email' && order === 'asc' ? 'desc' : 'asc';
                                                        setSortBy('email');
                                                        setOrder(newOrder);
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Email</span>
                                                        {sortBy === 'email' && (
                                                            <span>{order === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {isLoadingUsers ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center space-y-4">
                                                            <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                            <p className="text-gray-500 font-medium">Loading users data...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : users.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 pt-32">
                                                        No users found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.map((user) => (
                                                    <tr key={user.id || user._id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="font-bold text-gray-900">{user.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                            {user.email || (user as any).Email || (user as any).EMAIL}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.role === Role.SUPER_ADMIN
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : user.role === Role.ADMIN
                                                                    ? 'bg-indigo-100 text-indigo-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="flex justify-center items-center space-x-2">
                                                                <button
                                                                    onClick={() => handleEditClick(user)}
                                                                    className={`p-2 rounded-lg transition-colors ${userEmail === user.email
                                                                        ? 'text-gray-300 cursor-not-allowed'
                                                                        : 'text-indigo-600 hover:bg-indigo-50'
                                                                        }`}
                                                                    title={userEmail === user.email ? "You cannot edit your own basic info here" : "Edit User"}
                                                                    disabled={userEmail === user.email}
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id || user._id || '', user.name)}
                                                                    className={`p-2 rounded-lg transition-colors ${userEmail === user.email
                                                                        ? 'text-gray-300 cursor-not-allowed'
                                                                        : 'text-red-500 hover:bg-red-50'
                                                                        }`}
                                                                    title={userEmail === user.email ? "Cannot delete yourself" : "Delete User"}
                                                                    disabled={userEmail === user.email}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
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
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalUsers)}</span> of <span className="font-bold">{totalUsers}</span> results
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
                                                {Array.from({ length: Math.ceil(totalUsers / limit) }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => fetchUsers(i + 1)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'permissions-mgmt' && (
                    <PermissionsManagement />
                )}

                {activeTab === 'cms' && (
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
                            <h3 className="text-xl font-bold text-gray-900 font-outfit">Update Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                            <div className="p-6 bg-gray-50/50 flex justify-end space-x-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
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

            {/* Edit User Modal */}
            {showEditUserModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center font-outfit">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 mr-3">
                                    <Edit2 size={20} />
                                </div>
                                Edit User
                            </h3>
                            <button
                                onClick={() => setShowEditUserModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <Input
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    placeholder="User Name"
                                    className="w-full"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditUserModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                                    disabled={isUpdatingUser}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingUser}
                                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center"
                                >
                                    {isUpdatingUser ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-outfit">Delete User</h3>
                            <p className="text-gray-500">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{userToDelete?.name}</span>?
                                This action cannot be undone.
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
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isDeleting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isDeleting ? 'Deleting...' : 'Delete User'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
