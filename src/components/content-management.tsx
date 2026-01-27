'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Activity, FileText, CheckCircle2, XCircle, Eye } from 'lucide-react';
import api from '@/lib/axios';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ContentModule {
    id: string;
    _id?: string;
    title: string;
    shortDescription: string;
    description?: string;
    content: string;
    status: number; // 1 for active, 0 for inactive
    createdAt?: string;
    updatedAt?: string;
    created_at?: string;
    updated_at?: string;
}

export function ContentManagement() {
    const [contentList, setContentList] = useState<ContentModule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentContent, setCurrentContent] = useState<Partial<ContentModule>>({
        title: '',
        shortDescription: '',
        content: '',
        status: 1
    });
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contentToDelete, setContentToDelete] = useState<ContentModule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [contentToView, setContentToView] = useState<ContentModule | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        fetchContent();
    }, [currentPage, limit]);

    const fetchContent = async (page = currentPage, currentLimit = limit) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/content/list?page=${page}&limit=${currentLimit}`);
            if (response.data.success) {
                setContentList(response.data.data);
                setTotalItems(response.data.meta?.totalCount || response.data.data.length);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Fetch content error:', error);
            toast.error('Failed to fetch content modules');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchContent(1);
    };

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentContent({
            title: '',
            shortDescription: '',
            content: '',
            status: 1
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (content: ContentModule) => {
        setIsEditing(true);
        setCurrentContent({ ...content, id: content.id || content._id });
        setShowModal(true);
    };

    const handleSaveContent = async () => {
        if (!currentContent.title || !currentContent.shortDescription || !currentContent.content) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        const loadingToast = toast.loading(isEditing ? 'Updating content...' : 'Creating content...');

        try {
            if (isEditing) {
                await api.put(`/api/content/update/${currentContent.id}`, currentContent);
                toast.success('Content updated successfully!', { id: loadingToast });
            } else {
                await api.post('/api/content/create', currentContent);
                toast.success('Content created successfully!', { id: loadingToast });
            }
            setShowModal(false);
            fetchContent();
        } catch (error) {
            console.error('Save content error:', error);
            toast.error(isEditing ? 'Failed to update content' : 'Failed to create content', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (content: ContentModule) => {
        setContentToDelete(content);
        setShowDeleteModal(true);
    };

    const handleViewClick = (content: ContentModule) => {
        setContentToView(content);
        setShowViewModal(true);
    };

    const confirmDelete = async () => {
        if (!contentToDelete) return;

        setIsDeleting(true);
        const loadingToast = toast.loading('Deleting content...');

        try {
            const id = contentToDelete.id || contentToDelete._id;
            await api.delete(`/api/content/delete/${id}`);
            toast.success('Content deleted successfully!', { id: loadingToast });
            setShowDeleteModal(false);
            setContentToDelete(null);
            fetchContent();
        } catch (error) {
            console.error('Delete content error:', error);
            toast.error('Failed to delete content', { id: loadingToast });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
                    <p className="text-gray-500 mt-1">Manage your application&apos;s content modules and pages.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold"
                >
                    <Plus size={20} />
                    <span>Create New Module</span>
                </button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white text-gray-900 font-medium"
                    />
                </form>
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
                        onClick={() => fetchContent()}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                        title="Refresh"
                    >
                        <Activity size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="text-gray-500 font-medium">Loading content...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : contentList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center text-gray-400">
                                            <FileText size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No content modules found</p>
                                            <p className="text-sm">Create your first module to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contentList.map((content) => (
                                    <tr key={content.id || content._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{content.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="group relative">
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    {content.shortDescription || content.description}
                                                </div>
                                                {(content.shortDescription || content.description) && (content.shortDescription || content.description)!.length > 40 && (
                                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                                        <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl max-w-xs whitespace-normal">
                                                            {content.shortDescription || content.description}
                                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${content.status === 1
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {content.status === 1 ? (
                                                    <><CheckCircle2 size={12} className="mr-1" /> Active</>
                                                ) : (
                                                    <><XCircle size={12} className="mr-1" /> Inactive</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {(() => {
                                                const date = content.updated_at || content.updatedAt || content.created_at || content.createdAt;
                                                return date ? new Date(date).toLocaleDateString() : 'N/A';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewClick(content)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(content)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(content)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
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
                {!isLoading && contentList.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalItems)}</span> of <span className="font-bold">{totalItems}</span> results
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage * limit >= totalItems}
                                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditing ? 'Edit Content Module' : 'Create New Module'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={currentContent.title}
                                    onChange={(e) => setCurrentContent({ ...currentContent, title: e.target.value })}
                                    placeholder="Enter module title"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Short Description</label>
                                <textarea
                                    value={currentContent.shortDescription}
                                    onChange={(e) => setCurrentContent({ ...currentContent, shortDescription: e.target.value })}
                                    placeholder="Enter a brief overview"
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Content (HTML Supported)</label>
                                <textarea
                                    value={currentContent.content}
                                    onChange={(e) => setCurrentContent({ ...currentContent, content: e.target.value })}
                                    placeholder="Enter the main body content"
                                    rows={8}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm text-gray-900"
                                />
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-bold text-gray-700">Status:</label>
                                <button
                                    onClick={() => setCurrentContent({ ...currentContent, status: currentContent.status === 1 ? 0 : 1 })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentContent.status === 1 ? 'bg-indigo-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentContent.status === 1 ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                                <span className="text-sm font-medium text-gray-600">
                                    {currentContent.status === 1 ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveContent}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isSaving && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isSaving ? 'Saving...' : (isEditing ? 'Update Module' : 'Create Module')}</span>
                            </button>
                        </div>
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Content Module</h3>
                            <p className="text-gray-500">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{contentToDelete?.title}</span>?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isDeleting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>{isDeleting ? 'Deleting...' : 'Delete Module'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Content Modal */}
            {showViewModal && contentToView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                View Content Module
                            </h3>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                                <p className="text-xl font-bold text-gray-900">{contentToView.title}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Short Description</label>
                                <p className="text-gray-600 leading-relaxed">{contentToView.shortDescription || contentToView.description}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Content</label>
                                <div
                                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: contentToView.content }}
                                />
                            </div>
                            <div className="flex items-center space-x-6 pt-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${contentToView.status === 1
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {contentToView.status === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Last Updated</label>
                                    <p className="text-sm text-gray-600">
                                        {(() => {
                                            const date = contentToView.updated_at || contentToView.updatedAt || contentToView.created_at || contentToView.createdAt;
                                            return date ? new Date(date).toLocaleString() : 'N/A';
                                        })()}
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
