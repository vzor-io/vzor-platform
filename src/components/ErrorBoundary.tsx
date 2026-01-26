import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-neutral-900 text-red-500 p-10 font-mono overflow-auto">
                    <h1 className="text-4xl mb-4">💥 SOMETHING CRASHED</h1>
                    <p className="text-xl text-white mb-2">Please show this error to the developer:</p>
                    <div className="bg-black p-4 rounded border border-red-900 whitespace-pre-wrap">
                        {this.state.error?.toString()}
                    </div>
                    <div className="mt-4 text-gray-500 text-sm whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
