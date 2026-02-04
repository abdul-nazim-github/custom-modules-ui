'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, XCircle, ShieldCheck } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import api from '@/lib/axios';
import axios from 'axios';
import toast from 'react-hot-toast';

interface RoleData {
    id?: string;
    _id?: string;
    name?: string;
    key?: string;
    slug?: string;
    description?: string;
    permissions?: string[];
    status?: number | string;
    created_at?: string;
    updated_at?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PermissionMatrix {
    modules: string[];
    actions: string[];
    permissions: string[];
}

export function RolesManagement() {
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 2000);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState<Partial<RoleData>>({
        name: '',
        permissions: []
    });
    const [isSaving, setIsSaving] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchMatrix = useCallback(async () => {
        try {
            const response = await api.get('/api/permissions/matrix');
            if (response.data.success) {
                setMatrix(response.data.data);
            }
        } catch (error) {
            console.error('Fetch matrix error:', error);
        }
    }, []);

    const fetchRoles = useCallback(async (page = currentPage, currentLimit = limit, search = debouncedSearchTerm) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        try {
            const response = await api.get(`/api/roles/list?page=${page}&limit=${currentLimit}&search=${encodeURIComponent(search)}`, {
                signal: controller.signal
            });
            if (response.data.success) {
                setRoles(response.data.data || []);
                setTotalItems(response.data.meta?.totalCount || response.data.total || response.data.data?.length || 0);
                setCurrentPage(page);
                setLimit(currentLimit);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Request canceled');
                return;
            }
            console.error('Fetch roles error:', error);
            toast.error('Failed to fetch roles');
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [currentPage, limit, debouncedSearchTerm]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchMatrix();
    }, [fetchMatrix]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRoles(1);
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentRole({
            name: '',
            permissions: []
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (role: RoleData) => {
        setIsEditing(true);
        setCurrentRole({
            ...role,
            _id: role._id || role.id,
            id: role.id || role._id
        });
        setShowModal(true);
    };

    const handleSaveRole = async () => {
        const name = currentRole.name?.trim();

        if (!name) {
            toast.error('Please enter a role name');
            return;
        }

        setIsSaving(true);
        const loadingToast = toast.loading(isEditing ? 'Updating role...' : 'Creating role...');

        try {
            const payload = {
                name,
                permissions: currentRole.permissions || []
            };

            if (isEditing) {
                const roleId = currentRole._id || currentRole.id;
                const response = await api.put(`/api/roles/update/${roleId}`, payload);
                if (response.data.success === false) {
                    throw new Error(response.data.message || 'Failed to update role');
                }
                toast.success('Role updated successfully!', { id: loadingToast });
            } else {
                const response = await api.post('/api/roles/create', payload);
                if (response.data.success === false) {
                    throw new Error(response.data.message || 'Failed to create role');
                }
                toast.success('Role created successfully!', { id: loadingToast });
            }
            setShowModal(false);
            fetchRoles();
        } catch (error) {
            console.error('Save role error:', error);
            toast.error(isEditing ? 'Failed to update role' : 'Failed to create role', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (role: RoleData) => {
        setRoleToDelete(role);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;

        setIsDeleting(true);
        const loadingToast = toast.loading('Deleting role...');

        try {
            const id = roleToDelete._id || roleToDelete.id;
            const response = await api.delete(`/api/roles/delete/${id}`);
            if (response.data.success === false) {
                throw new Error(response.data.message || 'Failed to delete role');
            }
            toast.success('Role deleted successfully!', { id: loadingToast });
            setShowDeleteModal(false);
            setRoleToDelete(null);
            fetchRoles();
        } catch (error) {
            console.error('Delete role error:', error);
            toast.error('Failed to delete role', { id: loadingToast });
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePermission = (permission: string) => {
        setCurrentRole(prev => {
            const permissions = prev.permissions || [];
            if (permissions.includes(permission)) {
                return { ...prev, permissions: permissions.filter(p => p !== permission) };
            }
            return { ...prev, permissions: [...permissions, permission] };
        });
    };

    const toggleModuleWildcard = (module: string) => {
        const wildcard = `${module}.*`;
        togglePermission(wildcard);
    };

    const formatRoleName = (role: RoleData) => {
        return role.name || role.key || role.slug || 'Unnamed Role';
    };

    const formatPermissionLabel = (permission: string): string => {
        if (permission.endsWith('.*')) {
            const parts = permission.slice(0, -2).split('.');
            const moduleName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            return `All ${moduleName} Actions`;
        }

        const parts = permission.split('.');
        const action = parts[parts.length - 1];
        const modulePath = parts.slice(0, -1);

        const moduleLabel = modulePath.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

        return `${moduleLabel} - ${actionLabel}`;
    };

    const getRoleUpdatedAt = (role: RoleData) => {
        const dateStr = role.updated_at || role.updatedAt || role.created_at || role.createdAt;
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            return '-';
        }
    };

    const getStatusLabel = (status?: number | string) => {
        if (typeof status === 'number') return status === 1 ? 'Active' : 'Inactive';
        if (typeof status === 'string') return status.toLowerCase();
        return 'Active';
    };

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return (
        <>
            <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
                        <p className="text-gray-500 mt-1">Create, update, and manage application roles.</p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold"
                    >
                        <Plus size={20} />
                        <span>Create New Role</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <input
                                    type="text"
                                    placeholder="Search roles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Updated</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {roles.map(role => {
                                    const id = role.id || role._id;
                                    return (
                                        <tr key={id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{formatRoleName(role)}</div>
                                                {role.description && (
                                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {(role.permissions || []).slice(0, 3).map(p => (
                                                        <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-md font-bold whitespace-nowrap">
                                                            {formatPermissionLabel(p)}
                                                        </span>
                                                    ))}
                                                    {(role.permissions || []).length > 3 && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-bold">
                                                            +{(role.permissions || []).length - 3} more
                                                        </span>
                                                    )}
                                                    {(role.permissions || []).length === 0 && (
                                                        <span className="text-gray-400 text-xs italic">No permissions</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    {getStatusLabel(role.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{getRoleUpdatedAt(role) || '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(role)}
                                                        className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                                                        title="Edit role"
                                                    >
                                                        <Edit2 size={16} className="text-indigo-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(role)}
                                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Delete role"
                                                    >
                                                        <Trash2 size={16} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!isLoading && roles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            No roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} roles
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => fetchRoles(currentPage - 1)}
                                disabled={currentPage === 1 || isLoading}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm font-bold text-gray-700">{currentPage} / {totalPages}</span>
                            <button
                                onClick={() => fetchRoles(currentPage + 1)}
                                disabled={currentPage >= totalPages || isLoading}
                                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-none">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditing ? 'Edit Role' : 'Create Role'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Role Name</label>
                                <input
                                    type="text"
                                    value={currentRole.name || ''}
                                    onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                                    placeholder="e.g. Supervisor"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                />
                            </div>

                            {matrix && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <ShieldCheck size={18} className="text-indigo-600" />
                                        <label className="text-sm font-bold text-gray-700">Assign Permissions</label>
                                    </div>

                                    {matrix.modules.map(module => {
                                        const allModulePermissions = matrix.permissions.filter(p => p.startsWith(`${module}.`));
                                        const directPermissions = allModulePermissions.filter(p => p.split('.').length === 2);

                                        const submoduleGroups: Record<string, string[]> = {};
                                        allModulePermissions.forEach(p => {
                                            const parts = p.split('.');
                                            if (parts.length === 3) {
                                                const submodule = parts[1];
                                                if (!submoduleGroups[submodule]) {
                                                    submoduleGroups[submodule] = [];
                                                }
                                                submoduleGroups[submodule].push(p);
                                            }
                                        });

                                        const wildcardPermission = `${module}.*`;
                                        const hasWildcard = currentRole.permissions?.includes(wildcardPermission);

                                        return (
                                            <div key={module} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
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

                                                {directPermissions.length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                                        {directPermissions.map(permission => (
                                                            <button
                                                                key={permission}
                                                                onClick={() => togglePermission(permission)}
                                                                disabled={hasWildcard}
                                                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${currentRole.permissions?.includes(permission) || hasWildcard
                                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                                    : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                                    }`}
                                                            >
                                                                {permission.split('.').pop()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {Object.keys(submoduleGroups).map(submodule => {
                                                    const submoduleWildcard = `${module}.${submodule}.*`;
                                                    const hasSubmoduleWildcard = currentRole.permissions?.includes(submoduleWildcard);

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
                                                                        className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all disabled:opacity-50 ${currentRole.permissions?.includes(permission) || hasWildcard || hasSubmoduleWildcard
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
                        <div className="p-6 bg-gray-50 flex justify-end space-x-3 border-t border-gray-100 flex-none">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRole}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isSaving && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isSaving ? 'Saving...' : (isEditing ? 'Update Role' : 'Create Role')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && roleToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Role</h3>
                            <p className="text-gray-500">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{formatRoleName(roleToDelete)}</span>?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setRoleToDelete(null);
                                }}
                                className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isDeleting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isDeleting ? 'Deleting...' : 'Delete Role'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
