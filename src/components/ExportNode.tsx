import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Download, FileBox, FileSpreadsheet } from 'lucide-react';

const COLORS = {
    RED: '#ef4444',   // Geometry
    BLUE: '#3b82f6',  // Data
    WHITE: '#ffffff'  // Flow
};

export const ExportNode = ({ data }: { data: { label: string, exportType: 'GEOMETRY' | 'DATA', format?: string } }) => {
    const isGeometry = data.exportType === 'GEOMETRY';
    const socketColor = isGeometry ? COLORS.RED : COLORS.BLUE;
    const Icon = isGeometry ? FileBox : FileSpreadsheet;

    return (
        <div className="bg-[#2c2c2c] border border-gray-600 rounded-lg shadow-xl min-w-[200px] text-xs flex flex-col">
            {/* Header */}
            <div className={`
                px-3 py-2 rounded-t-lg border-b border-gray-600 flex justify-between items-center handle
                ${isGeometry ? 'bg-red-900/30' : 'bg-blue-900/30'}
            `}>
                <div className="flex items-center gap-2">
                    <Icon size={14} className={isGeometry ? 'text-red-400' : 'text-blue-400'} />
                    <span className="font-bold text-gray-200">{data.label}</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{data.format || (isGeometry ? 'FBX' : 'XLSX')}</div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-3">
                {/* Inputs */}
                <div className="flex flex-col gap-2">
                    <div className="relative flex items-center h-6">
                        <Handle
                            type="target"
                            id="trigger"
                            position={Position.Left}
                            style={{ background: COLORS.WHITE, width: 8, height: 8 }}
                        />
                        <span className="ml-3 text-gray-400">Trigger</span>
                    </div>
                    <div className="relative flex items-center h-6">
                        <Handle
                            type="target"
                            id="input"
                            position={Position.Left}
                            style={{ background: socketColor, width: 8, height: 8, borderRadius: 0 }} // Square for data/geo to diff from flow? Or just color. User said color.
                        />
                        <span className="ml-3 text-gray-400">{isGeometry ? 'Geometry' : 'Data'}</span>
                    </div>
                </div>

                {/* Action */}
                <button className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#333] border border-gray-700 rounded py-1.5 transition-colors">
                    <Download size={12} />
                    <span>Download File</span>
                </button>
            </div>
        </div>
    );
};
