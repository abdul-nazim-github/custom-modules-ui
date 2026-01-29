'use client';

import { useState } from 'react';
import { X, Send, Loader2, Mail, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading('Sending message...');

        try {
            const response = await axios.post('/api/contact/submit', formData);

            toast.success(response.data.message || 'Message sent successfully!', { id: loadingToast });
            setFormData({ name: '', email: '', subject: '', message: '' });
            onClose();
            router.push('/signin');
        } catch (error) {
            console.error('Contact form error:', error);
            toast.error('Failed to send message', { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Mail className="text-indigo-600" size={20} />
                            Contact Us
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">We'd love to hear from you!</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                Your Name
                            </label>
                            <Input
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={isLoading}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors text-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Mail size={16} className="text-gray-400" />
                                Email Address
                            </label>
                            <Input
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isLoading}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors text-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <MessageSquare size={16} className="text-gray-400" />
                                Subject
                            </label>
                            <Input
                                placeholder="Inquiry"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                disabled={isLoading}
                                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors text-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <MessageSquare size={16} className="text-gray-400" />
                                Message
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="How can we help you?"
                                rows={4}
                                disabled={isLoading}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none text-black"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                ) : (
                                    <Send className="mr-2" size={20} />
                                )}
                                {isLoading ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
