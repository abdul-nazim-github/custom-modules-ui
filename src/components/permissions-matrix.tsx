'use client';

import { useState, useEffect } from 'react';
import { Shield, Save, Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface UserData {
    id: string;
    _id?: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
}

// Define the structure for our matrix rows
interface PermissionRow {
    id: string;
    label: string;
    subLabel?: string;
    isHeader?: boolean;
    permissions: {
        view?: string;
        create?: string;
        modify?: string;
        cancel?: string; // Not used yet but in design
        delete?: string;
    };
}

// Define the matrix structure
const PERMISSION_MATRIX: PermissionRow[] = [
    {
        id: 'profile',
        label: 'Profile',
        permissions: {
            view: 'modules~permission~profile'
        }
    },
    {
        id: 'settings',
        label: 'Settings',
        permissions: {
            view: 'modules~permission~settings'
        }
    },
    {
        id: 'activity',
        label: 'Activity',
        permissions: {
            view: 'modules~permission~activity'
        }
    },
    {
        id: 'security',
        label: 'Security',
        permissions: {
            view: 'modules~permission~security'
        }
    },
    {
        id: 'users',
        label: 'User Management',
        permissions: {
            view: 'modules~permission~manage_users',
            modify: 'modules~permission~manage_users', // Currently shared
            delete: 'modules~permission~manage_users' // Currently shared
        }
    },
    {
        id: 'content',
        label: 'Content Management',
        permissions: {
            view: 'modules~permission~content',
            create: 'modules~permission~content_create',
            modify: 'modules~permission~content_edit',
            delete: 'modules~permission~content_delete'
        }
    }
];

export function PermissionsMatrix() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/auth/users?limit=100'); // Fetch enough users for dropdown
            if (response.data.success) {
                setUsers(response.data.data);
                // Select first user by default if available
                if (response.data.data.length > 0) {
                    handleUserSelect(response.data.data[0].id || response.data.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error('Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
        const user = users.find(u => (u.id || u._id) === userId);
        if (user) {
            setCurrentUserPermissions(user.permissions || []);
        }
    };

    const togglePermission = (permissionString: string) => {
        if (!selectedUserId) return;

        setCurrentUserPermissions(prev => {
            if (prev.includes(permissionString)) {
                return prev.filter(p => p !== permissionString);
            } else {
                return [...prev, permissionString];
            }
        });
    };

    const handleSave = async () => {
        if (!selectedUserId) return;

        setIsSaving(true);
        const loadingToast = toast.loading('Saving permissions...');

        try {
            await api.put(`/api/auth/users/${selectedUserId}/permissions`, {
                permissions: currentUserPermissions
            });

            // Update local user state
            setUsers(prev => prev.map(u =>
                (u.id || u._id) === selectedUserId
                    ? { ...u, permissions: currentUserPermissions }
                    : u
            ));

            toast.success('Permissions saved successfully!', { id: loadingToast });
        } catch (error) {
            console.error('Save permissions error:', error);
            toast.error('Failed to save permissions', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const isPermissionEnabled = (permissionString?: string) => {
        if (!permissionString) return false;
        return currentUserPermissions.includes(permissionString);
    };

    return (
        <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Permissions Matrix</h2>
                    <p className="text-gray-500 mt-1">Manage granular permissions for users.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !selectedUserId}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>Save Changes</span>
                </button>
            </div>

            {/* User Selection */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select User to Manage</label>
                <select
                    value={selectedUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium"
                >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                        <option key={user.id || user._id} value={user.id || user._id}>
                            {user.name} ({user.email}) - {user.role}
                        </option>
                    ))}
                </select>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Module / Feature</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">View</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Create</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Modify</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Delete</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {PERMISSION_MATRIX.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{row.label}</div>
                                        {row.subLabel && <div className="text-xs text-gray-500">{row.subLabel}</div>}
                                    </td>

                                    {/* View Column */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {row.permissions.view ? (
                                            <button
                                                onClick={() => togglePermission(row.permissions.view!)}
                                                className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-all ${isPermissionEnabled(row.permissions.view)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-gray-300 text-transparent hover:border-indigo-400'
                                                    }`}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <span className="inline-block h-1 w-4 bg-gray-200 rounded-full"></span>
                                        )}
                                    </td>

                                    {/* Create Column */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {row.permissions.create ? (
                                            <button
                                                onClick={() => togglePermission(row.permissions.create!)}
                                                className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-all ${isPermissionEnabled(row.permissions.create)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-gray-300 text-transparent hover:border-indigo-400'
                                                    }`}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <span className="inline-block h-1 w-4 bg-gray-200 rounded-full"></span>
                                        )}
                                    </td>

                                    {/* Modify Column */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {row.permissions.modify ? (
                                            <button
                                                onClick={() => togglePermission(row.permissions.modify!)}
                                                className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-all ${isPermissionEnabled(row.permissions.modify)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-gray-300 text-transparent hover:border-indigo-400'
                                                    }`}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <span className="inline-block h-1 w-4 bg-gray-200 rounded-full"></span>
                                        )}
                                    </td>

                                    {/* Delete Column */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {row.permissions.delete ? (
                                            <button
                                                onClick={() => togglePermission(row.permissions.delete!)}
                                                className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-all ${isPermissionEnabled(row.permissions.delete)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-gray-300 text-transparent hover:border-indigo-400'
                                                    }`}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <span className="inline-block h-1 w-4 bg-gray-200 rounded-full"></span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
