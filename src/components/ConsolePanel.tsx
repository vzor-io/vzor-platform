import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

interface LogEntry {
    id: number;
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
}

// Console Panel - shows debug logs
const ConsolePanel = () => {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 1, timestamp: new Date(), level: 'info', message: 'VZOR initialized' },
        { id: 2, timestamp: new Date(), level: 'success', message: 'Area system ready' },
    ]);

    // Intercept console.log calls
    useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            setLogs(prev => [...prev.slice(-99), {
                id: Date.now(),
                timestamp: new Date(),
                level: 'info',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }]);
        };

        console.warn = (...args) => {
            originalWarn(...args);
            setLogs(prev => [...prev.slice(-99), {
                id: Date.now(),
                timestamp: new Date(),
                level: 'warn',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }]);
        };

        console.error = (...args) => {
            originalError(...args);
            setLogs(prev => [...prev.slice(-99), {
                id: Date.now(),
                timestamp: new Date(),
                level: 'error',
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }]);
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    const levelColors = {
        info: 'text-gray-400',
        warn: 'text-yellow-400',
        error: 'text-red-400',
        success: 'text-green-400'
    };

    return (
        <div className="h-full bg-[#1e1e1e] text-white flex flex-col">
            {/* Header */}
            <div className="h-6 bg-[#2d2d2d] border-b border-[#1a1a1a] flex items-center px-2 gap-2">
                <Terminal className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Console</span>
                <div className="flex-1" />
                <button
                    onClick={() => setLogs([])}
                    className="text-[9px] text-gray-500 hover:text-white px-2"
                >
                    Clear
                </button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-auto p-2 font-mono text-[10px]">
                {logs.map(log => (
                    <div key={log.id} className="flex gap-2 py-0.5">
                        <span className="text-gray-600">
                            {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={levelColors[log.level]}>
                            [{log.level.toUpperCase()}]
                        </span>
                        <span className="text-gray-300">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConsolePanel;
