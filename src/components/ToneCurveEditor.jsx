import React, { useRef, useState, useEffect } from 'react';

const ToneCurveEditor = ({ curve, onChange }) => {
    const canvasRef = useRef(null);
    const [draggingPoint, setDraggingPoint] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const size = 256;
    const padding = 20;

    useEffect(() => {
        drawCurve();
    }, [curve, hoveredPoint]);

    const drawCurve = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const pos = padding + (i * (size - padding * 2)) / 4;
            ctx.beginPath();
            ctx.moveTo(pos, padding);
            ctx.lineTo(pos, size - padding);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(padding, pos);
            ctx.lineTo(size - padding, pos);
            ctx.stroke();
        }

        // Draw diagonal reference line
        ctx.strokeStyle = '#334155';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, size - padding);
        ctx.lineTo(size - padding, padding);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw curve
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < 256; x++) {
            const y = curve.lookupTable[x];
            const canvasX = padding + ((x / 255) * (size - padding * 2));
            const canvasY = size - padding - ((y / 255) * (size - padding * 2));

            if (x === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        ctx.stroke();

        // Draw control points
        curve.points.forEach((point, index) => {
            const [x, y] = point;
            const canvasX = padding + ((x / 255) * (size - padding * 2));
            const canvasY = size - padding - ((y / 255) * (size - padding * 2));

            const isHovered = hoveredPoint === index;

            ctx.fillStyle = isHovered ? '#22d3ee' : '#06b6d4';
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, isHovered ? 8 : 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    };

    const getPointAtPosition = (x, y) => {
        return curve.points.findIndex((point) => {
            const [px, py] = point;
            const canvasX = padding + ((px / 255) * (size - padding * 2));
            const canvasY = size - padding - ((py / 255) * (size - padding * 2));
            const distance = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
            return distance < 10;
        });
    };

    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on existing point
        const pointIndex = getPointAtPosition(x, y);

        if (pointIndex !== -1) {
            setDraggingPoint(pointIndex);
        } else {
            // Add new point
            const imageX = Math.round(((x - padding) / (size - padding * 2)) * 255);
            const imageY = Math.round((1 - (y - padding) / (size - padding * 2)) * 255);

            if (imageX >= 0 && imageX <= 255 && imageY >= 0 && imageY <= 255) {
                curve.addPoint(imageX, imageY);
                onChange(curve);
            }
        }
    };

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (draggingPoint !== null) {
            const imageX = Math.round(((x - padding) / (size - padding * 2)) * 255);
            const imageY = Math.round((1 - (y - padding) / (size - padding * 2)) * 255);

            curve.updatePoint(draggingPoint,
                Math.max(0, Math.min(255, imageX)),
                Math.max(0, Math.min(255, imageY))
            );
            onChange(curve);
        } else {
            // Update hovered point
            const pointIndex = getPointAtPosition(x, y);
            setHoveredPoint(pointIndex !== -1 ? pointIndex : null);
        }
    };

    const handleMouseUp = () => {
        setDraggingPoint(null);
    };

    const handleMouseLeave = () => {
        setDraggingPoint(null);
        setHoveredPoint(null);
    };

    const handleDoubleClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const pointIndex = getPointAtPosition(x, y);

        if (pointIndex !== -1 && pointIndex !== 0 && pointIndex !== curve.points.length - 1) {
            curve.removePoint(pointIndex);
            onChange(curve);
        }
    };

    return (
        <div className="tone-curve-editor space-y-2">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}
                className="cursor-crosshair border-2 border-cyan-800/40 rounded"
                style={{ width: '100%', height: 'auto', maxWidth: '256px' }}
            />
            <div className="text-xs text-slate-400 space-y-1">
                <p>• Click to add control points</p>
                <p>• Drag points to adjust curve</p>
                <p>• Double-click to remove points</p>
            </div>
        </div>
    );
};

export default ToneCurveEditor;
