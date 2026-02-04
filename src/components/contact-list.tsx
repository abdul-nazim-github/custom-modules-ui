'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, Activity, Mail, XCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { PortalTooltip } from '@/components/ui/portal-tooltip';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface ContactSubmission {
    id: string;
    _id?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt?: string;
    created_at?: string;
}

export function ContactList() {
    const [contacts, setContacts] = useState<ContactSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 3000);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // View Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [contactToView, setContactToView] = useState<ContactSubmission | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchContacts();
    }, [currentPage, limit, sortField, sortOrder, debouncedSearchTerm]);

    const fetchContacts = async (page = currentPage, currentLimit = limit, search = debouncedSearchTerm, sortBy = sortField, order = sortOrder) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/contact/list?page=${page}&limit=${currentLimit}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&order=${order}`);
            if (response.data.success) {
                setContacts(response.data.data);
                // Adjust based on actual API response structure for meta
                setTotalItems(response.data.meta?.totalCount || response.data.total || response.data.data.length);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Fetch contacts error:', error);
            toast.error('Failed to fetch contact submissions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchContacts(1);
    };

    const handleViewClick = async (contact: ContactSubmission) => {
        setContactToView(contact);
        setShowViewModal(true);
        setIsLoadingDetails(true);

        try {
            const id = contact.id || contact._id;
            const response = await api.get(`/api/contact/${id}`);
            if (response.data.success) {
                setContactToView(response.data.data);
            }
        } catch (error) {
            console.error('Fetch contact details error:', error);
            toast.error('Failed to fetch contact details');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    return (
        <div className="p-8 transition-all duration-500 opacity-100 translate-y-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Contact Submissions</h2>
                    <p className="text-gray-500 mt-1">View and manage contact form submissions.</p>
                </div>
            </div>

            {/* Filters and Refresh */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search submissions..."
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
                        onClick={() => fetchContacts()}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200"
                        title="Refresh"
                    >
                        <Activity size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                <div className="overflow-x-auto min-h-[580px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => {
                                        const newOrder = sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc';
                                        setSortField('name');
                                        setSortOrder(newOrder);
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Name</span>
                                        {sortField === 'name' && (
                                            <span className="text-indigo-600 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => {
                                        const newOrder = sortField === 'email' && sortOrder === 'asc' ? 'desc' : 'asc';
                                        setSortField('email');
                                        setSortOrder(newOrder);
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Email</span>
                                        {sortField === 'email' && (
                                            <span className="text-indigo-600 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => {
                                        const newOrder = sortField === 'subject' && sortOrder === 'asc' ? 'desc' : 'asc';
                                        setSortField('subject');
                                        setSortOrder(newOrder);
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Subject</span>
                                        {sortField === 'subject' && (
                                            <span className="text-indigo-600 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => {
                                        const newOrder = sortField === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc';
                                        setSortField('created_at');
                                        setSortOrder(newOrder);
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Date</span>
                                        {sortField === 'created_at' && (
                                            <span className="text-indigo-600 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="text-gray-500 font-medium">Loading submissions...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Mail size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No submissions found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr key={contact.id || contact._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{contact.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{contact.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {contact.subject && contact.subject.length > 30 ? (
                                                <PortalTooltip content={contact.subject}>
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">{contact.subject}</div>
                                                </PortalTooltip>
                                            ) : (
                                                <div className="text-sm text-gray-900 max-w-xs truncate">{contact.subject}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {(() => {
                                                const date = contact.createdAt || contact.created_at;
                                                return date ? new Date(date).toLocaleDateString() : 'N/A';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewClick(contact)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && contacts.length > 0 && (
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
                                        onClick={() => fetchContacts(currentPage - 1)}
                                        disabled={currentPage === 1 || isLoading}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    {Array.from({ length: Math.max(1, Math.ceil(totalItems / limit)) }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => fetchContacts(i + 1)}
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
                                        onClick={() => fetchContacts(currentPage + 1)}
                                        disabled={currentPage * limit >= totalItems || isLoading}
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
                                onClick={() => fetchContacts(currentPage - 1)}
                                disabled={currentPage === 1 || isLoading}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => fetchContacts(currentPage + 1)}
                                disabled={currentPage * limit >= totalItems || isLoading}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {showViewModal && contactToView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                Submission Details
                            </h3>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {isLoadingDetails ? (
                                <div className="flex justify-center py-12">
                                    <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name</label>
                                            <p className="text-gray-900 font-medium">{contactToView.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                                            <p className="text-gray-900 font-medium">{contactToView.email}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                                        <p className="text-gray-900 font-medium">{contactToView.subject}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message</label>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap">
                                            {contactToView.message}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted On</label>
                                        <p className="text-sm text-gray-600">
                                            {(() => {
                                                const date = contactToView.createdAt || contactToView.created_at;
                                                return date ? new Date(date).toLocaleDateString() : 'N/A';
                                            })()}
                                        </p>
                                    </div>
                                </>
                            )}
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
