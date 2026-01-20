import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPECIAL_CHARS } from '@/lib/validation';

interface PasswordChecklistProps {
    password: string;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password }) => {
    const requirements = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
        { label: 'At least one number', met: /[0-9]/.test(password) },
        { label: 'At least one special character', met: new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password) },
    ];

    return (
        <div className="mt-2 space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password Requirements</p>
            {requirements.map((req, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <div className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300",
                        req.met ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    )}>
                        {req.met ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                    </div>
                    <span className={cn(
                        "text-xs font-medium transition-colors duration-300",
                        req.met ? "text-green-600" : "text-gray-500"
                    )}>
                        {req.label}
                    </span>
                </div>
            ))}
        </div>
    );
};
