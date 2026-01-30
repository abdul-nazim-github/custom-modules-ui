'use client';

import { useState, useRef, useEffect, ReactNode, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalTooltipProps {
    content: ReactNode;
    children: ReactNode;
}

export function PortalTooltip({ content, children }: PortalTooltipProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Position state: coordinates and placement metadata
    const [tooltipStyles, setTooltipStyles] = useState<{
        top: number;
        left: number;
        placement: 'top' | 'bottom';
        arrowLeft: number;
        opacity: number;
    }>({ top: 0, left: 0, placement: 'top', arrowLeft: 0, opacity: 0 });

    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Measure and position the tooltip
    const calculatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 10; // Viewport padding

        // Dimensions
        const triggerCenter = triggerRect.left + triggerRect.width / 2;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 1. Horizontal Positioning (Shifting)
        let left = triggerRect.left;

        // Check right overflow
        if (left + tooltipRect.width > viewportWidth - padding) {
            left = viewportWidth - tooltipRect.width - padding;
        }
        // Check left overflow
        if (left < padding) {
            left = padding;
        }

        // Calculate Arrow X (relative to tooltip)
        let arrowLeft = triggerCenter - left;
        const safeZone = 20;
        if (arrowLeft < safeZone) arrowLeft = safeZone;
        if (arrowLeft > tooltipRect.width - safeZone) arrowLeft = tooltipRect.width - safeZone;

        // 2. Vertical Positioning (Flipping)
        let top = 0;
        let placement: 'top' | 'bottom' = 'top';

        // Space needed above: tooltipRect.height + arrowHeight (approx 8px)
        const spaceAbove = triggerRect.top;
        const spaceBelow = viewportHeight - triggerRect.bottom;

        // If not enough space above AND more space below, flip to bottom
        if (spaceAbove < tooltipRect.height + 10 && spaceBelow > spaceAbove) {
            placement = 'bottom';
            // Position below the element
            // No scrollY added because fixed position is relative to viewport
            top = triggerRect.bottom + 8; // 8px gap
        } else {
            placement = 'top';
            // Position above the element
            // No scrollY added because fixed position is relative to viewport
            top = triggerRect.top - 8;
        }

        setTooltipStyles({
            top,
            left, // No scrollX added
            placement,
            arrowLeft,
            opacity: 1 // Reveal after calculation
        });
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(true);
        // We will calculate position in useLayoutEffect when isHovered becomes true
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
            // Reset opacity so next time it measures invisibly first
            setTooltipStyles(prev => ({ ...prev, opacity: 0 }));
        }, 300);
    };

    // Recalculate when hovered or content changes
    useLayoutEffect(() => {
        if (isHovered) {
            calculatePosition();
            // Use capture=true to detect scrolling in nested containers
            window.addEventListener('scroll', calculatePosition, true);
            window.addEventListener('resize', calculatePosition);
        }
        return () => {
            window.removeEventListener('scroll', calculatePosition, true);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isHovered, content]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-block max-w-full"
            >
                {children}
            </div>

            {isHovered && typeof document !== 'undefined' && createPortal(
                <div
                    ref={tooltipRef}
                    className="fixed z-[9999] pointer-events-auto transition-opacity duration-150"
                    style={{
                        top: tooltipStyles.top,
                        left: tooltipStyles.left,
                        opacity: tooltipStyles.opacity,
                        transform: tooltipStyles.placement === 'top' ? 'translateY(-100%)' : 'none'
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="relative">
                        {/* Content Box */}
                        <div className="bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl max-w-md whitespace-normal leading-relaxed border border-gray-800 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                            {content}
                        </div>

                        {/* Arrow */}
                        <div
                            className={`absolute w-0 h-0 border-4 border-transparent ${tooltipStyles.placement === 'top'
                                    ? 'border-t-gray-900 top-full -mt-[1px]' // pointing down
                                    : 'border-b-gray-900 bottom-full -mb-[1px]' // pointing up
                                }`}
                            style={{
                                left: tooltipStyles.arrowLeft,
                                transform: 'translateX(-50%)' // Center arrow on the coordinate
                            }}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
