import { useRef, useCallback, useEffect } from 'react';
import {
    applyBasicAdjustments,
    applyTemperatureAndTint,
    applyVibrance,
    applyToneCurve,
    applyHSLAdjustments,
    applyClarity,
    applyDehaze,
    applyVignette,
    applyGrain,
    applyBlur,
} from '../utils/imageProcessing';

// Max dimension for the live-edit preview canvas.
// A 3000px image downscales to 1200px → ~6× fewer pixels → ~6× faster edits.
const MAX_PREVIEW_PX = 1200;

/**
 * useCanvasEditor — dual-canvas image editing hook.
 *
 * Architecture:
 *   • previewCanvasRef  — visible, downscaled (max 1200px). Used for all live edits.
 *   • fullCanvas        — hidden in-memory canvas at original resolution. Used only for export.
 *   • Web Worker        — processes full-res export off the main thread.
 *
 * applyAdjustments() operates only on the preview canvas via requestAnimationFrame,
 * coalescing rapid slider events into single frames.
 *
 * exportBlob() sends the full-res original to the Worker, waits for the processed
 * ArrayBuffer, then calls toBlob() on the full canvas.
 */
export const useCanvasEditor = (originalImage) => {
    // ── Refs ─────────────────────────────────────────────────────────────────
    const canvasRef          = useRef(null);   // visible preview canvas (mounted in DOM)
    const fullCanvasRef      = useRef(null);   // in-memory full-resolution canvas
    const previewOriginalRef = useRef(null);   // ImageData snapshot of downscaled original
    const fullOriginalRef    = useRef(null);   // ImageData snapshot of full-res original
    const imageRef           = useRef(null);   // the loaded HTMLImageElement

    const rafRef             = useRef(null);   // current requestAnimationFrame id
    const pendingAdjRef      = useRef(null);   // latest adjustments waiting for next RAF
    const onDoneRef          = useRef(null);   // callback to fire after RAF completes
    const lastAppliedRef     = useRef(null);   // last adjustments actually rendered

    const workerRef          = useRef(null);   // Web Worker for export
    const exportResolveRef   = useRef(null);   // resolve() for the pending exportBlob promise
    const exportRejectRef    = useRef(null);   // reject()  for the pending exportBlob promise

    // ── Web Worker lifecycle ─────────────────────────────────────────────────
    useEffect(() => {
        const worker = new Worker(
            new URL('../workers/imageProcessingWorker.js', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (e) => {
            const { processedBuffer, width, height, error } = e.data;

            if (error) {
                console.error('[Worker] Processing error:', error);
                exportRejectRef.current?.(new Error(error));
                exportRejectRef.current = null;
                exportResolveRef.current = null;
                return;
            }

            // Paint worker result onto the full-res canvas and export
            const full = fullCanvasRef.current;
            if (!full) return;

            const ctx    = full.getContext('2d');
            const result = new ImageData(new Uint8ClampedArray(processedBuffer), width, height);
            ctx.putImageData(result, 0, 0);

            full.toBlob(
                (blob) => {
                    if (blob) exportResolveRef.current?.(blob);
                    else      exportRejectRef.current?.(new Error('toBlob returned null'));
                    exportResolveRef.current = null;
                    exportRejectRef.current  = null;
                },
                e.data.format  || 'image/png',
                e.data.quality ?? 0.95
            );
        };

        worker.onerror = (err) => {
            console.error('[Worker] Fatal error:', err);
            exportRejectRef.current?.(new Error(err.message));
        };

        workerRef.current = worker;
        return () => worker.terminate();
    }, []);

    // ── Image load — sets up both canvases ───────────────────────────────────
    useEffect(() => {
        if (!originalImage || !canvasRef.current) return;

        const img    = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            imageRef.current = img;
            const W = img.naturalWidth;
            const H = img.naturalHeight;

            // ── Preview canvas (visible) ──────────────────────────────────
            const scale = Math.min(1, MAX_PREVIEW_PX / Math.max(W, H));
            const pw    = Math.round(W * scale);
            const ph    = Math.round(H * scale);

            const preview = canvasRef.current;
            preview.width  = pw;
            preview.height = ph;
            const pCtx = preview.getContext('2d', { willReadFrequently: true });
            pCtx.drawImage(img, 0, 0, pw, ph);
            previewOriginalRef.current = pCtx.getImageData(0, 0, pw, ph);

            // ── Full-res canvas (in memory, never mounted) ────────────────
            const full      = document.createElement('canvas');
            full.width  = W;
            full.height = H;
            const fCtx  = full.getContext('2d', { willReadFrequently: true });
            fCtx.drawImage(img, 0, 0);
            fullOriginalRef.current = fCtx.getImageData(0, 0, W, H);
            fullCanvasRef.current   = full;
        };

        img.onerror = (err) => console.error('[useCanvasEditor] Image load failed:', err);
        img.src = originalImage;
    }, [originalImage]);

    // ── Internal pipeline runner (runs inside RAF) ───────────────────────────
    const runPipeline = useCallback((adj, canvas, originalData) => {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Always start from a fresh copy of the original (non-destructive)
        let imageData = new ImageData(
            new Uint8ClampedArray(originalData.data),
            canvas.width,
            canvas.height
        );

        if (adj.basic) {
            imageData = applyBasicAdjustments(imageData, adj.basic);
        }

        if (adj.color) {
            const { temperature = 0, tint = 0, vibrance = 0, saturation = 0 } = adj.color;
            if (temperature !== 0 || tint !== 0) {
                imageData = applyTemperatureAndTint(imageData, temperature, tint);
            }
            if (vibrance !== 0 || saturation !== 0) {
                imageData = applyVibrance(imageData, vibrance, saturation);
            }
        }

        if (adj.toneCurve?.lookupTable) {
            imageData = applyToneCurve(imageData, adj.toneCurve);
        }

        if (adj.hsl) {
            imageData = applyHSLAdjustments(imageData, adj.hsl);
        }

        if (adj.effects) {
            const { clarity = 0, dehaze = 0, vignette = 0, grain = 0 } = adj.effects;
            if (clarity  !== 0) imageData = applyClarity(imageData, clarity);
            if (dehaze   !== 0) imageData = applyDehaze(imageData, dehaze);
            if (vignette !== 0) imageData = applyVignette(imageData, vignette);
            if (grain    !== 0) imageData = applyGrain(imageData, grain);
        }

        if (adj.blur > 0) imageData = applyBlur(imageData, adj.blur);

        ctx.putImageData(imageData, 0, 0);
    }, []);

    // ── applyAdjustments — RAF-scheduled, preview canvas only ────────────────
    /**
     * Schedule an adjustment render on the preview canvas.
     *
     * Rapid calls (e.g. from slider dragging) are coalesced:
     * only the LATEST adjustments are processed per animation frame.
     * The UI never blocks — the RAF callback runs after the browser paints.
     *
     * @param {object}   adjustments - the full adjustments object
     * @param {Function} [onDone]    - called after the canvas is updated
     */
    const applyAdjustments = useCallback((adjustments, onDone) => {
        // Always store the latest value so the RAF picks up the most recent state
        pendingAdjRef.current = adjustments;
        if (onDone) onDoneRef.current = onDone;

        // If a frame is already queued, let it run with the updated pendingAdj — no-op
        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
            const adj          = pendingAdjRef.current;
            const done         = onDoneRef.current;
            const canvas       = canvasRef.current;
            const originalData = previewOriginalRef.current;

            // Clear refs before async work
            pendingAdjRef.current = null;
            onDoneRef.current     = null;
            rafRef.current        = null;

            if (!canvas || !originalData || !adj) return;

            try {
                runPipeline(adj, canvas, originalData);
                lastAppliedRef.current = adj;
            } catch (err) {
                console.error('[useCanvasEditor] Pipeline error:', err);
            }

            done?.();
        });
    }, [runPipeline]);

    // ── renderOriginal — for Before/After toggle ─────────────────────────────
    const renderOriginal = useCallback(() => {
        const canvas = canvasRef.current;
        const orig   = previewOriginalRef.current;
        if (!canvas || !orig) return;

        // Cancel any pending RAF so we don't overwrite the "before" view
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.putImageData(orig, 0, 0);
    }, []);

    // ── getHistogramData — reads the preview canvas (small, fast) ────────────
    const getHistogramData = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const ctx       = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data      = imageData.data;

        const histR = new Array(256).fill(0);
        const histG = new Array(256).fill(0);
        const histB = new Array(256).fill(0);

        for (let i = 0; i < data.length; i += 4) {
            histR[data[i]]++;
            histG[data[i + 1]]++;
            histB[data[i + 2]]++;
        }

        const maxVal = Math.max(...histR, ...histG, ...histB);
        return { r: histR, g: histG, b: histB, maxVal };
    }, []);

    // ── exportBlob — full-res via Web Worker ─────────────────────────────────
    /**
     * Export the full-resolution image with all current adjustments applied.
     * Processing happens in a Web Worker so the main thread stays responsive.
     * Returns a Promise<Blob>.
     */
    const exportBlob = useCallback((format = 'image/png', quality = 0.95) => {
        return new Promise((resolve, reject) => {
            const fullOriginal = fullOriginalRef.current;
            const worker       = workerRef.current;

            if (!fullOriginal || !worker) {
                reject(new Error('Editor not ready for export'));
                return;
            }

            const adj = lastAppliedRef.current;
            if (!adj) {
                // No adjustments applied yet — export the original directly
                fullCanvasRef.current?.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
                    format, quality
                );
                return;
            }

            // Serialize adjustments for structured clone (ToneCurve → plain object)
            const workerAdj = {
                ...adj,
                toneCurve: adj.toneCurve?.lookupTable
                    ? { lookupTable: Array.from(adj.toneCurve.lookupTable) }
                    : null,
            };

            // Store promise callbacks so the worker onmessage handler can resolve them
            exportResolveRef.current = resolve;
            exportRejectRef.current  = reject;

            // Transfer a COPY of the full-res buffer (zero-copy ArrayBuffer transfer)
            const { width, height } = fullOriginal;
            const bufferCopy = fullOriginal.data.buffer.slice(0);

            worker.postMessage(
                { buffer: bufferCopy, width, height, adjustments: workerAdj, format, quality },
                [bufferCopy]   // ← transfer ownership; no copy made by the structured clone
            );
        });
    }, []);

    // ── exportImage (legacy data-URL) ────────────────────────────────────────
    const exportImage = useCallback((format = 'image/jpeg', quality = 0.95) => {
        return canvasRef.current?.toDataURL(format, quality) ?? null;
    }, []);

    return {
        canvasRef,
        applyAdjustments,
        exportImage,
        exportBlob,
        renderOriginal,
        getHistogramData,
    };
};

// ── useDebounce ───────────────────────────────────────────────────────────────
/**
 * Debounce hook — kept for backward compatibility (history commits).
 */
export const useDebounce = (callback, delay) => {
    const timerRef = useRef(null);
    return useCallback((...args) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
};
