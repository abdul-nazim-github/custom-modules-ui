'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-red-100 shadow-xl">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6 max-w-md">
                        We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reload Page
                    </Button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-8 p-4 bg-gray-900 text-red-400 text-xs text-left overflow-auto max-w-full rounded-lg">
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
