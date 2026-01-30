'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Activity, Shield, CheckCircle2, XCircle, Eye, User } from 'lucide-react';
import api from '@/lib/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import { hasPermission, getPermissionLabel, groupPermissionsByModule } from '@/lib/permission-utils';

interface PermissionData {
    _id: string;
    userId?: string;
    user?: {
        id?: string;
        _id?: string;
        name?: string;
        email?: string;
        Email?: string;
    } | null;
    permissions: string[];
    created_at: string;
    updated_at: string;
}

interface PermissionMatrix {
    modules: string[];
    actions: string[];
    permissions: string[];
}

interface UserData {
    id: string;
    _id?: string;
    email: string;
    name: string;
}

export function PermissionsManagement() {
    const [permissionsList, setPermissionsList] = useState<PermissionData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPermission, setCurrentPermission] = useState<Partial<PermissionData>>({
        userId: '',
        permissions: []
    });
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState<PermissionData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [permissionToView, setPermissionToView] = useState<PermissionData | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        fetchPermissions();
        // fetchUsers(); // Only fetch users when needed for modal
        fetchMatrix();
    }, [currentPage, limit]);

    const fetchPermissions = async (page = currentPage, currentLimit = limit) => {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        try {
            const response = await api.get(`/api/permissions/list?page=${page}&limit=${currentLimit}`, {
                signal: controller.signal
            });
            if (response.data.success) {
                setPermissionsList(response.data.data || []);
                setTotalItems(response.data.meta?.totalCount || response.data.data?.length || 0);
                setCurrentPage(page);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Request canceled');
                return;
            }
            console.error('Fetch permissions error:', error);
            toast.error('Failed to fetch permissions');
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/auth/users?limit=1000');
            if (response.data.success) {
                setUsers(response.data.data || []);
            }
        } catch (error) {
            console.error('Fetch users error:', error);
        }
    };

    const fetchMatrix = async () => {
        try {
            const response = await api.get('/api/permissions/matrix');
            if (response.data.success) {
                setMatrix(response.data.data);
            }
        } catch (error) {
            console.error('Fetch matrix error:', error);
        }
    };

    const getUserName = (permission: PermissionData) => {
        if (permission.user) {
            const userName = permission.user.name || 'Unknown User';
            const userEmail = permission.user.email || permission.user.Email || 'No Email';
            return `${userName} (${userEmail})`;
        }

        const effectiveUserId = permission.userId || (permission as any).user_id;
        if (effectiveUserId) {
            const user = users.find(u => (u.id || u._id) === effectiveUserId);
            return user ? `${user.name} (${user.email})` : `User ID: ${effectiveUserId}`;
        }

        return 'Not Assigned';
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentPermission({
            userId: '',
            permissions: []
        });
        if (users.length === 0) fetchUsers();
        setShowModal(true);
    };

    const handleOpenEditModal = (permission: PermissionData) => {
        setIsEditing(true);
        // Ensure userId is present for the select in the modal
        const userId = permission.userId || permission.user?.id || permission.user?._id || '';
        setCurrentPermission({ ...permission, userId });
        if (users.length === 0) fetchUsers();
        setShowModal(true);
    };

    const handleSavePermission = async () => {
        if (!currentPermission.userId) {
            toast.error('Please select a user');
            return;
        }

        if (!currentPermission.permissions || currentPermission.permissions.length === 0) {
            toast.error('Please select at least one permission');
            return;
        }

        setIsSaving(true);
        const loadingToast = toast.loading(isEditing ? 'Updating permissions...' : 'Creating permissions...');

        try {
            if (isEditing) {
                // Use _id for update endpoint as per user request/api change
                await api.put(`/api/permissions/update/${currentPermission._id}`, {
                    permissions: currentPermission.permissions
                });
                toast.success('Permissions updated successfully!', { id: loadingToast });
            } else {
                await api.post('/api/permissions/create', {
                    userId: currentPermission.userId,
                    permissions: currentPermission.permissions
                });
                toast.success('Permissions created successfully!', { id: loadingToast });
            }
            setShowModal(false);
            fetchPermissions();
        } catch (error) {
            console.error('Save permission error:', error);
            toast.error(isEditing ? 'Failed to update permissions' : 'Failed to create permissions', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewClick = (permission: PermissionData) => {
        setPermissionToView(permission);
        setShowViewModal(true);
    };

    const togglePermission = (permission: string) => {
        setCurrentPermission(prev => {
            const permissions = prev.permissions || [];
            if (permissions.includes(permission)) {
                return { ...prev, permissions: permissions.filter(p => p !== permission) };
            } else {
                return { ...prev, permissions: [...permissions, permission] };
            }
        });
    };

    const toggleModuleWildcard = (module: string) => {
        const wildcard = `${module}.*`;
        togglePermission(wildcard);
    };

    const formatPermissionLabel = (permission: string): string => {
        if (permission.endsWith('.*')) {
            // Handle wildcards: "profile.*" -> "All Profile Actions"
            const parts = permission.slice(0, -2).split('.');
            const moduleName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            return `All ${moduleName} Actions`;
        }

        // Handle regular permissions: "settings.view" -> "Settings - View"
        const parts = permission.split('.');
        const action = parts[parts.length - 1];
        const modulePath = parts.slice(0, -1);

        const moduleLabel = modulePath.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

        return `${moduleLabel} - ${actionLabel}`;
    };

    return (
        <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
                    <p className="text-gray-500 mt-1">Manage user permissions with granular control.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold"
                >
                    <Plus size={20} />
                    <span>Assign Permissions</span>
                </button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 font-medium">Show:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 text-sm font-medium"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <button
                        onClick={() => fetchPermissions()}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                        title="Refresh"
                    >
                        <Activity size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Permissions Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="overflow-x-auto min-h-[580px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="text-gray-500 font-medium">Loading permissions...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : permissionsList.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Shield size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No permissions found</p>
                                            <p className="text-sm">Assign permissions to users to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                permissionsList
                                    .filter(perm => {
                                        if (!searchTerm) return true;
                                        const userName = getUserName(perm).toLowerCase();
                                        return userName.includes(searchTerm.toLowerCase());
                                    })
                                    .map((permission) => (
                                        <tr key={permission._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                                                        <User size={20} />
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {getUserName(permission)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {permission.permissions.slice(0, 3).map(p => (
                                                        <span key={p} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-md font-bold">
                                                            {formatPermissionLabel(p)}
                                                        </span>
                                                    ))}
                                                    {permission.permissions.length > 3 && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-bold">
                                                            +{permission.permissions.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(permission.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewClick(permission)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(permission)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
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
                {!isLoading && permissionsList.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalItems)}</span> of{' '}
                                    <span className="font-bold">{totalItems}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => fetchPermissions(currentPage - 1)}
                                        disabled={currentPage === 1 || isLoading}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    {Array.from({ length: Math.max(1, Math.ceil(totalItems / limit)) }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => fetchPermissions(i + 1)}
                                            disabled={currentPage === i + 1 || isLoading}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${currentPage === i + 1
                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => fetchPermissions(currentPage + 1)}
                                        disabled={currentPage * limit >= totalItems || isLoading}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditing ? 'Edit Permissions' : 'Assign Permissions'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Select User</label>
                                <select
                                    value={currentPermission.userId}
                                    onChange={(e) => setCurrentPermission({ ...currentPermission, userId: e.target.value })}
                                    disabled={isEditing}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select a user...</option>
                                    {users.map(user => (
                                        <option key={user.id || user._id} value={user.id || user._id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {matrix && (
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700">Select Permissions</label>

                                    {matrix.modules.map(module => {
                                        // Get all permissions for this module
                                        const allModulePermissions = matrix.permissions.filter(p => p.startsWith(`${module}.`));

                                        // Separate direct module permissions from submodule permissions
                                        const directPermissions = allModulePermissions.filter(p => {
                                            const parts = p.split('.');
                                            return parts.length === 2; // module.action (no submodule)
                                        });

                                        // Group submodule permissions
                                        const submoduleGroups: Record<string, string[]> = {};
                                        allModulePermissions.forEach(p => {
                                            const parts = p.split('.');
                                            if (parts.length === 3) { // module.submodule.action
                                                const submodule = parts[1];
                                                if (!submoduleGroups[submodule]) {
                                                    submoduleGroups[submodule] = [];
                                                }
                                                submoduleGroups[submodule].push(p);
                                            }
                                        });

                                        const wildcardPermission = `${module}.*`;
                                        const hasWildcard = currentPermission.permissions?.includes(wildcardPermission);

                                        return (
                                            <div key={module} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                {/* Main Module Header */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-bold text-gray-900 capitalize">{module}</h4>
                                                    <button
                                                        onClick={() => toggleModuleWildcard(module)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${hasWildcard
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-400'
                                                            }`}
                                                    >
                                                        {hasWildcard ? '✓ All Actions' : 'Select All'}
                                                    </button>
                                                </div>

                                                {/* Direct Module Permissions (if any) */}
                                                {directPermissions.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                                        {directPermissions.map(permission => (
                                                            <button
                                                                key={permission}
                                                                onClick={() => togglePermission(permission)}
                                                                disabled={hasWildcard}
                                                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${currentPermission.permissions?.includes(permission) || hasWildcard
                                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                                    : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                                    }`}
                                                            >
                                                                {permission.split('.').pop()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Submodules */}
                                                {Object.keys(submoduleGroups).map(submodule => {
                                                    const submoduleWildcard = `${module}.${submodule}.*`;
                                                    const hasSubmoduleWildcard = currentPermission.permissions?.includes(submoduleWildcard);

                                                    return (
                                                        <div key={submodule} className="mt-3 pl-4 border-l-2 border-indigo-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="text-xs font-bold text-gray-700 capitalize">{submodule}</h5>
                                                                <button
                                                                    onClick={() => togglePermission(submoduleWildcard)}
                                                                    disabled={hasWildcard}
                                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all disabled:opacity-50 ${hasSubmoduleWildcard || hasWildcard
                                                                        ? 'bg-indigo-600 text-white'
                                                                        : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
                                                                        }`}
                                                                >
                                                                    {hasSubmoduleWildcard || hasWildcard ? '✓ All' : 'All'}
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                {submoduleGroups[submodule].map(permission => (
                                                                    <button
                                                                        key={permission}
                                                                        onClick={() => togglePermission(permission)}
                                                                        disabled={hasWildcard || hasSubmoduleWildcard}
                                                                        className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${currentPermission.permissions?.includes(permission) || hasWildcard || hasSubmoduleWildcard
                                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                                            : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                                            }`}
                                                                    >
                                                                        {permission.split('.').pop()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePermission}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isSaving && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isSaving ? 'Saving...' : (isEditing ? 'Update Permissions' : 'Assign Permissions')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && permissionToView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                View Permissions
                            </h3>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">User</label>
                                <p className="text-lg font-bold text-gray-900">{getUserName(permissionToView)}</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Permissions ({permissionToView.permissions.length})</label>

                                {(() => {
                                    // 1. Identify all unique actions across all permissions
                                    const allActionsSet = new Set<string>();
                                    // We need to scan all permissions first to find all possible actions
                                    // But we also have a pre-defined list of common actions we might want to order first
                                    const commonActions = ['view', 'create', 'edit', 'delete'];

                                    permissionToView.permissions.forEach(p => {
                                        if (!p.endsWith('.*')) {
                                            const parts = p.split('.');
                                            if (parts.length >= 2) {
                                                const action = parts[parts.length - 1];
                                                allActionsSet.add(action);
                                            }
                                        }
                                    });

                                    // Create a sorted list of actions for columns
                                    // Put common actions first in specific order, then others alphabetically
                                    const dynamicActions = Array.from(allActionsSet).sort((a, b) => {
                                        const indexA = commonActions.indexOf(a);
                                        const indexB = commonActions.indexOf(b);
                                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                        if (indexA !== -1) return -1;
                                        if (indexB !== -1) return 1;
                                        return a.localeCompare(b);
                                    });

                                    // If no actions found (e.g. only wildcards or empty), fallback to common defaults
                                    if (dynamicActions.length === 0) {
                                        dynamicActions.push(...commonActions);
                                    }

                                    // 2. Group permissions by module and submodule
                                    const moduleMap: Record<string, { actions: Record<string, boolean>; hasWildcard: boolean; isSubmodule: boolean }> = {};

                                    permissionToView.permissions.forEach(p => {
                                        const parts = p.split('.');
                                        let modulePath = '';
                                        let action = '';
                                        let isSubmodule = false;
                                        // Handle wildcard
                                        if (p.endsWith('.*')) {
                                            modulePath = p.slice(0, -2); // Remove .*
                                            action = '*';
                                            const moduleParts = modulePath.split('.');
                                            if (moduleParts.length > 1) {
                                                isSubmodule = true;
                                            }
                                        } else {
                                            if (parts.length >= 2) {
                                                action = parts[parts.length - 1];
                                                modulePath = parts.slice(0, -1).join('.');
                                                if (parts.length > 2) {
                                                    isSubmodule = true;
                                                }
                                            }
                                        }

                                        if (!modulePath) return;

                                        // Ensure entry exists
                                        if (!moduleMap[modulePath]) {
                                            moduleMap[modulePath] = { actions: {}, hasWildcard: false, isSubmodule };
                                        }

                                        // Ensure parent exists if submodule
                                        if (isSubmodule) {
                                            const parentModule = modulePath.split('.')[0];
                                            if (!moduleMap[parentModule]) {
                                                moduleMap[parentModule] = { actions: {}, hasWildcard: false, isSubmodule: false };
                                            }
                                        }

                                        if (action === '*') {
                                            moduleMap[modulePath].hasWildcard = true;
                                            dynamicActions.forEach(act => {
                                                moduleMap[modulePath].actions[act] = true;
                                            });
                                        } else {
                                            moduleMap[modulePath].actions[action] = true;
                                        }
                                    });

                                    // Sort entries
                                    const sortedEntries = Object.entries(moduleMap).sort(([pathA, dataA], [pathB, dataB]) => {
                                        const partsA = pathA.split('.');
                                        const partsB = pathB.split('.');

                                        if (partsA.length !== partsB.length) {
                                            if (partsA.length === 1 && partsB.length === 2 && partsB[0] === partsA[0]) return -1;
                                            if (partsB.length === 1 && partsA.length === 2 && partsA[0] === partsB[0]) return 1;
                                        }

                                        return pathA.localeCompare(pathB);
                                    });

                                    return (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                                Modules
                                                            </th>
                                                            {dynamicActions.map(action => (
                                                                <th key={action} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[80px]">
                                                                    {action}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {sortedEntries.map(([modulePath, data]) => {
                                                            const parts = modulePath.split('.');
                                                            const displayName = data.isSubmodule
                                                                ? parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1)
                                                                : parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

                                                            return (
                                                                <tr key={modulePath} className="hover:bg-gray-50">
                                                                    <td className={`px-4 py-3 text-sm font-bold text-gray-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${data.isSubmodule ? 'pl-8' : ''}`}>
                                                                        {data.isSubmodule && (
                                                                            <span className="mr-2 text-gray-400">└─</span>
                                                                        )}
                                                                        {displayName}
                                                                    </td>
                                                                    {dynamicActions.map(action => (
                                                                        <td key={action} className="px-4 py-3 text-center">
                                                                            {(data.actions[action] || data.hasWildcard) ? (
                                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                                                                                    ✓
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                                                                                    -
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Created</label>
                                    <p className="text-sm text-gray-600">
                                        {new Date(permissionToView.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Last Updated</label>
                                    <p className="text-sm text-gray-600">
                                        {new Date(permissionToView.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
