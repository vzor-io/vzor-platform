
import React, { useEffect, useState } from 'react';

export const Resizer = ({
    direction,
    onResize
}: {
    direction: 'HORIZONTAL' | 'VERTICAL',
    onResize: (delta: number) => void
}) => {
    const [isDragging, setIsDragging] = useState(false);

    // Initial drag position
    const [startPos, setStartPos] = useState(0);

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: MouseEvent) => {
            // Calculate delta based on screen size (approximate for now)
            // Ideally we need container size. 
            // For MVP: assume 1000px = 1.0 (Sensitive) OR use movement directly

            // Better: Just send raw pixel delta, parent Logic handles normalization?
            // Kernel expects 0.0-1.0 ratio.
            // Let's assume a sensitivity.
            const current = direction === 'VERTICAL' ? e.clientX : e.clientY;
            const diff = current - startPos;

            // Normalize: 500px = 0.5 change? No, usually relative to PARENT size.
            // Since we don't have parent ref here easily without refactoring recursion,
            // let's try a fixed sensitivity: 1000px screen width.
            const delta = diff / 1000;

            if (diff !== 0) {
                onResize(delta);
                setStartPos(current); // Reset for next frame
            }
        };

        const handleUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, startPos, direction, onResize]);

    const handleDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setStartPos(direction === 'VERTICAL' ? e.clientX : e.clientY);
        document.body.style.cursor = direction === 'VERTICAL' ? 'col-resize' : 'row-resize';
    };

    return (
        <div
            className={`bg-[#111] hover:bg-[#e77e22] transition-colors z-30 flex-shrink-0 relative
                ${direction === 'VERTICAL' ? 'w-[4px] cursor-col-resize -mx-[2px]' : 'h-[4px] cursor-row-resize -my-[2px]'}
                ${isDragging ? 'bg-[#e77e22]' : ''}
            `}
            onMouseDown={handleDown}
        >
            {/* Hitbox extender */}
            <div className={`absolute inset-0 ${direction === 'VERTICAL' ? '-mx-1 w-3' : '-my-1 h-3'}`}></div>
        </div>
    );
};
