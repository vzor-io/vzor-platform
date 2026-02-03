import React from 'react';
import type { SubAgent } from '../types/agent';
import type { WorkflowAgent } from '../engine/WorkflowTypes';

interface AgentInspectorProps {
    agent: SubAgent | WorkflowAgent | null;
    onClose: () => void;
}

/**
 * AgentInspector - панель "внутри агента"
 * Универсальная: работает и с простыми SubAgent, и с WorkflowAgent
 */
export const AgentInspector: React.FC<AgentInspectorProps> = ({ agent, onClose }) => {
    if (!agent) return null;

    // Type Guards / Adapters
    const isWorkflowAgent = (a: any): a is WorkflowAgent => 'outputs' in a;

    // Normalize Data
    const status = agent.status.toUpperCase();
    const role = (agent as any).role || 'Unknown Agent';
    const outputs = isWorkflowAgent(agent) ? agent.outputs : (agent as any).output ? { result: (agent as any).output } : {};
    const knowledgeBases = (agent as any).knowledgeBases || [];
    const methodology = (agent as any).methodology;
    const model = (agent as any).model || 'Gemini 1.5 Pro';
    const progress = agent.progress || 0;

    // Цвет статуса
    const statusColors: Record<string, string> = {
        PENDING: 'text-gray-400',
        IDLE: 'text-gray-400',
        RUNNING: 'text-cyan-400',
        COMPLETED: 'text-green-400',
        FAILED: 'text-red-400',
        PAUSED: 'text-yellow-400',
        WAITING: 'text-orange-400'
    };

    const statusLabels: Record<string, string> = {
        PENDING: 'Ожидание',
        IDLE: 'Готов',
        RUNNING: 'Выполняется',
        COMPLETED: 'Завершено',
        FAILED: 'Ошибка',
        PAUSED: 'Пауза',
        WAITING: 'Ждет данных'
    };

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-[#0a0a0a]/95 border-l border-gray-800 backdrop-blur-xl z-[60] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-xl">
                        {(agent as any).icon || '🤖'}
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm uppercase tracking-wide">{role}</h2>
                        <p className="text-xs text-gray-500 font-mono">ID: {agent.id.slice(0, 8)}...</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors p-2"
                >
                    ✕
                </button>
            </div>

            {/* Status */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm font-medium">STATUS</span>
                    <span className={`font-mono text-sm font-bold ${statusColors[status] || 'text-white'}`}>
                        {statusLabels[status] || status}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${status === 'FAILED' ? 'bg-red-500' : 'bg-cyan-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* OUTPUTS (Priority Display) */}
            {Object.keys(outputs).length > 0 && (
                <div className="p-4 border-b border-gray-800 bg-cyan-900/10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-cyan-400">📊</span>
                        <span className="text-cyan-100 text-sm font-bold">РЕЗУЛЬТАТЫ</span>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(outputs).map(([key, val]) => (
                            <div key={key} className="bg-[#111] rounded p-2 border border-cyan-500/20 flex justify-between items-center">
                                <span className="text-gray-400 text-xs uppercase">{key}</span>
                                <span className="text-cyan-300 font-mono text-xs font-bold text-right">
                                    {typeof val === 'object' ? JSON.stringify(val).slice(0, 20) + '...' : String(val)}
                                </span>
                            </div>
                        ))}
                    </div>
                    {status === 'COMPLETED' && (outputs.recommendation || outputs.decision) && (
                        <div className="mt-3 bg-cyan-500/10 p-2 rounded text-xs text-cyan-200 italic border-l-2 border-cyan-400">
                            "{outputs.recommendation || outputs.decision}"
                        </div>
                    )}
                </div>
            )}

            {/* Knowledge Bases */}
            {(knowledgeBases.length > 0 || isWorkflowAgent(agent)) && (
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400">📚</span>
                        <span className="text-gray-400 text-sm font-bold">БАЗЫ ЗНАНИЙ</span>
                    </div>
                    <div className="space-y-2">
                        {knowledgeBases.length > 0 ? knowledgeBases.map((kb: any) => (
                            <div key={typeof kb === 'string' ? kb : kb.id} className="bg-[#111] rounded p-2 border border-blue-900/30 flex items-center justify-between">
                                <span className="text-gray-300 text-xs">{typeof kb === 'string' ? kb.toUpperCase() : kb.name}</span>
                                <span className="text-blue-500 text-[10px]">CONNECTED</span>
                            </div>
                        )) : (
                            <div className="text-gray-600 text-xs italic pl-6">Нет подключенных баз</div>
                        )}
                    </div>
                </div>
            )}

            {/* Model Info */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400">🧠</span>
                    <span className="text-gray-400 text-sm font-bold">AI MODEL</span>
                </div>
                <div className="bg-[#111] rounded p-3 border border-gray-800">
                    <div className="flex justify-between">
                        <span className="text-white text-xs">{model}</span>
                        <span className="text-purple-500 text-[10px]">v2.0</span>
                    </div>
                </div>
            </div>

            {/* GENERATED ARTIFACTS (RESULT FILE) */}
            {status === 'COMPLETED' && (
                <div className="p-4 border-b border-gray-800 bg-green-900/10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-green-400">📂</span>
                        <span className="text-green-100 text-sm font-bold">ИТОГОВЫЙ ДОКУМЕНТ</span>
                    </div>
                    <button
                        onClick={() => alert(`Скачивание файла: ${role}_Report_v1.xlsx`)}
                        className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#222] border border-green-500/30 rounded flex items-center justify-between group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <div className="text-left">
                                <div className="text-green-400 font-mono text-xs font-bold group-hover:text-green-300 transition-colors">
                                    {role === 'fin_analyst' ? 'Investment_Deck_Final.pdf' : `${role}_Analysis.xlsx`}
                                </div>
                                <div className="text-gray-500 text-[10px]">1.2 MB • Generated now</div>
                            </div>
                        </div>
                        <span className="text-gray-500 group-hover:text-white transition-colors text-sm">⬇️</span>
                    </button>
                    {role === 'fin_analyst' && (
                        <div className="mt-2 flex gap-2">
                            <button className="flex-1 py-2 bg-green-600/20 text-green-400 text-xs border border-green-500/30 rounded hover:bg-green-600/30">
                                Открыть Excel
                            </button>
                            <button className="flex-1 py-2 bg-blue-600/20 text-blue-400 text-xs border border-blue-500/30 rounded hover:bg-blue-600/30">
                                Отправить в Telegram
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Methodology */}
            {methodology && (
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400">📐</span>
                        <span className="text-gray-400 text-sm font-bold">МЕТОДИКА</span>
                    </div>
                    <div className="bg-[#111] rounded p-2 border border-gray-800">
                        <p className="text-white text-xs">{methodology.name}</p>
                    </div>
                </div>
            )}

            {/* RAW DATA (Debug) */}
            <div className="p-4">
                <details className="text-[10px] text-gray-600 cursor-pointer">
                    <summary className="hover:text-gray-400">RAW DATA JSON</summary>
                    <pre className="mt-2 bg-black p-2 rounded overflow-x-auto border border-gray-800">
                        {JSON.stringify(agent, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
};
