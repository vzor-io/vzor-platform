import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { createNode, NODE_TEMPLATES, type NodeType } from '../engine/NodeFactory';
import { useVzorStore } from '../store/store';

// Node categories for VZOR
const NODE_CATEGORIES = {
    'Input': {
        icon: '📥',
        nodes: [
            { type: 'site' as NodeType, label: 'Site Data', icon: '📍' },
            { type: 'input' as NodeType, label: 'Document', icon: '📄' },
        ]
    },
    'Agents': {
        icon: '🤖',
        nodes: [
            { type: 'agent' as NodeType, label: 'Юрист', icon: '⚖️' },
            { type: 'agent' as NodeType, label: 'Архитектор', icon: '🏛️' },
            { type: 'agent' as NodeType, label: 'Геодезист', icon: '📐' },
            { type: 'agent' as NodeType, label: 'Проектировщик', icon: '📋' },
        ]
    },
    'Analysis': {
        icon: '📊',
        nodes: [
            { type: 'analysis' as NodeType, label: 'ПЗЗ Checker', icon: '✅' },
            { type: 'analysis' as NodeType, label: 'ГПЗУ Analyzer', icon: '🔍' },
            { type: 'analysis' as NodeType, label: 'СП Validator', icon: '📋' },
        ]
    },
    'Generators': {
        icon: '🏗️',
        nodes: [
            { type: 'generator' as NodeType, label: 'Building Massing', icon: '🏢' },
            { type: 'generator' as NodeType, label: 'Parking Layout', icon: '🅿️' },
            { type: 'generator' as NodeType, label: 'Landscaping', icon: '🌳' },
        ]
    },
    'Validators': {
        icon: '✅',
        nodes: [
            { type: 'validator' as NodeType, label: 'Compliance Check', icon: '✓' },
            { type: 'validator' as NodeType, label: 'Fire Safety', icon: '🔥' },
        ]
    },
    'Output': {
        icon: '📤',
        nodes: [
            { type: 'output' as NodeType, label: 'Report', icon: '📑' },
            { type: 'output' as NodeType, label: 'Visualization', icon: '🖼️' },
            { type: 'output' as NodeType, label: 'Export', icon: '💾' },
        ]
    }
};

interface AddNodeMenuProps {
    position: { x: number, y: number };
    onClose: () => void;
    onAddNode: (node: any) => void;
}

const AddNodeMenu = ({ position, onClose, onAddNode }: AddNodeMenuProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Focus search on mount
    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Filter nodes by search
    const filteredCategories = Object.entries(NODE_CATEGORIES).map(([category, data]) => ({
        category,
        ...data,
        nodes: data.nodes.filter(node =>
            searchQuery === '' ||
            node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.nodes.length > 0);

    const handleAddNode = (nodeType: NodeType, label: string) => {
        const node = createNode(nodeType, {
            x: position.x,
            y: position.y
        });
        // Override label if custom
        node.data.label = label;
        onAddNode(node);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="fixed bg-[#2d2d2d] border border-[#444] rounded-lg shadow-2xl z-[9999] w-[280px] max-h-[400px] overflow-hidden"
            style={{
                left: Math.min(position.x, window.innerWidth - 300),
                top: Math.min(position.y, window.innerHeight - 420)
            }}
        >
            {/* Search Header */}
            <div className="p-2 border-b border-[#444] flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search nodes..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={onClose} className="text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Categories */}
            <div className="overflow-auto max-h-[350px]">
                {filteredCategories.map(({ category, icon, nodes }) => (
                    <div key={category}>
                        {/* Category Header */}
                        <button
                            onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#3a3a3a] border-b border-[#333]"
                        >
                            <span>{icon}</span>
                            <span className="font-medium uppercase tracking-wider">{category}</span>
                            <span className="ml-auto text-gray-600">{nodes.length}</span>
                        </button>

                        {/* Nodes in category (always show if searching, otherwise toggle) */}
                        {(searchQuery || expandedCategory === category) && (
                            <div className="bg-[#252525]">
                                {nodes.map((node, idx) => (
                                    <button
                                        key={`${node.type}-${idx}`}
                                        onClick={() => handleAddNode(node.type, node.label)}
                                        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400 hover:bg-cyan-500/20 hover:text-white"
                                    >
                                        <span>{node.icon}</span>
                                        <span>{node.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-xs">
                        No nodes found
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="p-1.5 border-t border-[#444] text-[9px] text-gray-600 text-center">
                Start typing to search • ESC to close
            </div>
        </div>
    );
};

export default AddNodeMenu;
export { NODE_CATEGORIES };
